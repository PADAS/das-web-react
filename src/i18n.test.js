import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.join(__dirname, '../public/locales');
const FILES = ['components.json', 'menu-drawer.json'];

const collectValues = (node) => (typeof node === 'string'
  ? [node]
  : Object.values(node).flatMap(collectValues));

describe('i18n', () => {
  const locales = fs.readdirSync(LOCALES_DIR);

  test('covers all six locales', () => {
    expect(locales.sort()).toEqual(['en-US', 'es', 'fr', 'ne-NP', 'pt', 'sw']);
  });

  locales.forEach((locale) => {
    FILES.forEach((file) => {
      test(`no ${locale} ${file} value names Otus`, () => {
        const json = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, locale, file), 'utf8'));

        expect(collectValues(json).filter((value) => /otus/i.test(value))).toEqual([]);
      });
    });
  });
});
