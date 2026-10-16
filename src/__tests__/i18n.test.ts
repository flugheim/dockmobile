/**
 * Tester for oversettelsessystemet.
 * Kjør: se "test"-skriptet i package.json
 */
import {
  containerStateLabel,
  en,
  nb,
  resolveLang,
  translate,
} from '../i18n/translations';

declare const process: { exit(code: number): never };
let failures = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    console.log(`  ok - ${name}`);
  } else {
    failures++;
    console.log(`  FAIL - ${name}`, extra ?? '');
  }
}

// 1. nb dekker alle nøkler i en (og ingen ekstra)
const enKeys = Object.keys(en).sort();
const nbKeys = Object.keys(nb).sort();
check('nb har samme nøkler som en', JSON.stringify(enKeys) === JSON.stringify(nbKeys), {
  missingInNb: enKeys.filter((k) => !(k in nb)),
  extraInNb: nbKeys.filter((k) => !(k in en)),
});

// 2. Ingen tomme oversettelser
check(
  'ingen tomme strenger i nb',
  Object.values(nb).every((v) => v.length > 0),
);

// 3. Interpolering
check(
  'interpolering {n}',
  translate('en', 'banner_other', { n: 3 }) === '3 containers have updates available',
);
check(
  'interpolering {name}',
  translate('nb', 'confirmStopTitle', { name: 'db' }) === 'Stoppe db?',
);
check(
  'uten variabler beholdes teksten',
  translate('en', 'filter_all') === 'All' && translate('nb', 'filter_all') === 'Alle',
);

// 4. Språkoppløsning
check('system + nb -> nb', resolveLang('system', 'nb') === 'nb');
check('system + nn -> nb', resolveLang('system', 'nn') === 'nb');
check('system + no -> nb', resolveLang('system', 'no') === 'nb');
check('system + en -> en', resolveLang('system', 'en') === 'en');
check('system + ukjent -> en', resolveLang('system', 'de') === 'en');
check('eksplisitt nb overstyrer', resolveLang('nb', 'en') === 'nb');
check('eksplisitt en overstyrer', resolveLang('en', 'nb') === 'en');

// 5. Tilstandsetiketter
check('running på nb', containerStateLabel('running', 'nb') === 'Kjører');
check('running på en', containerStateLabel('running', 'en') === 'Running');
check('ukjent tilstand faller tilbake', containerStateLabel('weird', 'nb') === 'weird');

console.log(failures === 0 ? '\nALLE I18N-TESTER BESTÅTT' : `\n${failures} FEIL`);
process.exit(failures === 0 ? 0 : 1);
