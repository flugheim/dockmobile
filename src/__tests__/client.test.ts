/**
 * Enhetstester for normaliseringen av API-svar.
 * Kjør: npx tsc -p tsconfig.test.json && node dist-test/client.test.js
 */
import {
  normalizeContainers,
  normalizeLogs,
  normalizePendingUpdates,
  normalizeStacks,
  extractUpdateIds,
  stripAnsi,
  toArray,
} from '../api/client';

let failures = 0;
declare const process: { exit(code: number): never };
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    console.log(`  ok - ${name}`);
  } else {
    failures++;
    console.log(`  FAIL - ${name}`, extra ?? '');
  }
}

// 1. Flat container-liste (forventet hovedform)
const flat = [
  { id: 'abc123', name: 'nginx', image: 'nginx:latest', state: 'running', status: 'Up 2 hours' },
  { id: 'def456', name: '/db', image: 'postgres:16', state: 'exited', status: 'Exited (0) 5 minutes ago' },
];
const c1 = normalizeContainers(flat);
check('flat liste: 2 containere', c1.length === 2);
check('navn uten ledende /', c1[1].name === 'db');
check('state leses', c1[0].state === 'running' && c1[1].state === 'exited');
check('image leses', c1[0].image === 'nginx:latest');

// 2. Innpakketliste
const wrapped = { containers: flat };
check('innpakket {containers: []}', normalizeContainers(wrapped).length === 2);

// 3. Docker-inspect-stil (store forbokstaver)
const dockerStyle = [{ Id: 'xyz789', Names: ['/watchtower'], Image: 'ghcr.io/containrrr/watchtower:latest', State: { Status: 'running' } }];
const c3 = normalizeContainers(dockerStyle);
check('docker-stil: navn fra Names', c3[0].name === 'watchtower');
check('docker-stil: image fra Image', c3[0].image.includes('watchtower'));
check('docker-stil: state fra State.Status', c3[0].state === 'running');

// 4. Oppdateringsflagg i ulike varianter
check('flagg updateAvailable', normalizeContainers([{ id: 'a', name: 'a', updateAvailable: true }])[0].updateAvailable);
check('flagg hasUpdate', normalizeContainers([{ id: 'b', name: 'b', hasUpdate: true }])[0].updateAvailable);
check('flagg newDigest', normalizeContainers([{ id: 'c', name: 'c', newDigest: 'sha256:aa' }])[0].updateAvailable);
check('flagg hasImageUpdate', normalizeContainers([{ id: 'd', name: 'd', hasImageUpdate: true }])[0].updateAvailable);

// 5. extractUpdateIds fra ulike former
check('ids fra array', extractUpdateIds([{ containerId: 'a' }, { containerId: 'b' }]).size === 2);
check('ids fra {updates:[...]}', extractUpdateIds({ updates: [{ containerId: 'x', newDigest: 'sha256:1' }] }).has('x'));
check('ids fra map', extractUpdateIds({ 'id-1': { hasUpdate: true } }).has('id-1'));
check('ingen ids fra tom', extractUpdateIds({ containers: [] }).size === 0);

// 6) Resten av logg-normaliseringen
check('logger som tekst', normalizeLogs('linje1\nlinje2').length === 2);
check('logger som {logs}', normalizeLogs({ logs: 'a\nb\nc' }).length === 3);
check('ANSI fjernes', stripAnsi('\u001b[32mgrønn\u001b[0m') === 'grønn');
check('logger med ANSI', normalizeLogs({ logs: '\u001b[31mfeil\u001b[0m' })[0].text === 'feil');

// 7) toArray-fallback
check('toArray direkte array', toArray([1, 2]).length === 2);
check('toArray nøstet nøkkel', toArray({ data: [1] }).length === 1);
check('toArray tomt objekt', toArray({}).length === 0);

// 8) normalizePendingUpdates: bare reelle image-oppdateringer
const modernPending = {
  pendingUpdates: [
    { containerId: 'a', containerName: 'a', hasImageUpdate: true },
    { containerId: 'b', containerName: 'b', hasImageUpdate: false, pinnedToDigest: true },
    { containerId: 'c', containerName: 'c', hasImageUpdate: false, newerVersion: { tag: '2.0' } },
    { containerId: 'd', containerName: 'd', hasImageUpdate: false, releaseAgeRemainingHours: 12 },
  ],
};
const modernNorm = normalizePendingUpdates(modernPending);
check('pending: kun reelle oppdateringer beholdes', modernNorm.length === 1 && modernNorm[0].id === 'a');
const legacyPending = { pendingUpdates: [{ containerId: 'x' }, { containerId: 'y' }] };
check('pending: eldre svar uten flagg tar alle', normalizePendingUpdates(legacyPending).length === 2);
const pinnedOnly = { pendingUpdates: [{ containerId: 'p', hasImageUpdate: false, pinnedToDigest: true }] };
check('pending: kun pinned gir ingen oppdatering', normalizePendingUpdates(pinnedOnly).length === 0);
const wrappedPending = { data: [{ containerId: 'w', hasImageUpdate: true }] };
check('pending: innpakket form', normalizePendingUpdates(wrappedPending).length === 1);

// 9) normalizeStacks
const stacks = normalizeStacks([
  {
    name: 'web',
    status: 'running',
    health: 'healthy',
    containers: ['a', 'b'],
    containerDetails: [
      { id: 'a', name: 'web-1', service: 'web', state: 'running', image: 'nginx:latest', updateAvailable: true },
      { id: 'b', name: 'web-2', service: 'db', state: 'exited', image: 'postgres:16' },
    ],
    updateCount: 1,
  },
  { name: 'db', status: 'stopped', containers: [], containerDetails: [] },
]);
check('stacks: to stacks', stacks.length === 2);
check('stacks: teller containere', stacks.find((s) => s.name === 'web')!.containerCount === 2);
check('stacks: kjørende', stacks.find((s) => s.name === 'web')!.runningCount === 1);
check('stacks: oppdateringer', stacks.find((s) => s.name === 'web')!.updateCount === 1);
check('stacks: helse', stacks.find((s) => s.name === 'web')!.health === 'healthy');
check('stacks: containerdetaljer', stacks.find((s) => s.name === 'web')!.containers[0].service === 'web');
const wrappedStacks = normalizeStacks({ stacks: [{ name: 's', containers: [], containerDetails: [] }] });
check('stacks: innpakket form', wrappedStacks.length === 1);
const emptyStacks = normalizeStacks([{ name: '', containers: [] }]);
check('stacks: tomme navn filtreres', emptyStacks.length === 0);

console.log(failures === 0 ? '\\nALLE TESTER BESTÅTT' : `\\n${failures} FEIL`);
process.exit(failures === 0 ? 0 : 1);
