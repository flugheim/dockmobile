/**
 * Tester for fargetemaene.
 *
 * Sikrer at alle paletter har samme nøkkelsett (ellers krasjer `useTheme()` i
 * enkelte temaer) og at fargene er rene `#rrggbb`-verdier, som `alpha()`
 * forutsetter. Kjør: se "test"-skriptet i package.json
 */
import {
  DEFAULT_THEME,
  THEME_NAMES,
  isThemeName,
  palettes,
  themeMeta,
  type Palette,
} from '../theme/palettes';
import { alpha } from '../theme';

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

const referenceKeys = Object.keys(palettes.tokyoNight).sort();

// 1. Alle paletter har samme fargenavn
for (const name of THEME_NAMES) {
  const keys = Object.keys(palettes[name]).sort();
  check(`${name}: samme fargenøkler som tokyoNight`, JSON.stringify(keys) === JSON.stringify(referenceKeys), {
    missing: referenceKeys.filter((k) => !(k in palettes[name])),
    extra: keys.filter((k) => !(k in palettes.tokyoNight)),
  });
}

// 2. Farger er #rrggbb (alpha() godtar bare det) – overlay er unntaket
const hex = /^#[0-9a-fA-F]{6}$/;
for (const name of THEME_NAMES) {
  const palette = palettes[name] as Palette;
  const invalid = (Object.keys(palette) as (keyof Palette)[])
    .filter((key) => key !== 'overlay')
    .filter((key) => !hex.test(palette[key]));
  check(`${name}: alle farger er #rrggbb`, invalid.length === 0, invalid);
}

// 3. Overlay er rgba med alfa
for (const name of THEME_NAMES) {
  check(
    `${name}: overlay er rgba`,
    /^rgba\(\d+, \d+, \d+, 0?\.\d+\)$/.test(palettes[name].overlay),
    palettes[name].overlay,
  );
}

// 4. Metadata dekker alle temaer og standardtemaet finnes
const metaNames = Object.keys(themeMeta).sort();
check('themeMeta dekker alle temaer', JSON.stringify(metaNames) === JSON.stringify([...THEME_NAMES].sort()), {
  metaNames,
  THEME_NAMES,
});
check('standardtema finnes i palettene', THEME_NAMES.includes(DEFAULT_THEME), DEFAULT_THEME);

// 5. alpha() regner riktig for hver palett
for (const name of THEME_NAMES) {
  const c = palettes[name].accent;
  const r = parseInt(c.slice(1, 3), 16);
  const g = parseInt(c.slice(3, 5), 16);
  const b = parseInt(c.slice(5, 7), 16);
  check(`${name}: alpha() gir riktig rgba`, alpha(c, 0.5) === `rgba(${r}, ${g}, ${b}, 0.5)`, alpha(c, 0.5));
}

// 6. Ukjente tema-navn avvises (lagret verdi fra eldre versjoner)
check('ukjent tema avvises', !isThemeName('dracula-2020') && !isThemeName(null) && isThemeName('dracula'));

if (failures > 0) {
  console.log(`\n${failures} TESTER FEILET`);
  process.exit(1);
}
console.log('\nALLE TEMATESTER BESTÅTT');
