import fs from 'fs';
import path from 'path';

import { SUPPORTED_LANGUAGES } from './constants';

const FILES = ['components.json', 'menu-drawer.json'];
const LOCALES_DIR = path.join(__dirname, '../public/locales');

const collectValues = (node) => (typeof node === 'object' && node !== null
  ? Object.values(node).flatMap(collectValues)
  : [node]);

describe('i18n', () => {
  test('has a locale folder for every supported language', () => {
    expect(fs.readdirSync(LOCALES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()).toEqual(Object.keys(SUPPORTED_LANGUAGES).sort());
  });

  Object.keys(SUPPORTED_LANGUAGES).forEach((locale) => {
    FILES.forEach((file) => {
      test(`does not name Otus in any ${locale} ${file} value`, () => {
        const json = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, locale, file), 'utf8'));

        expect(collectValues(json).filter((value) => /\botus\b/i.test(value))).toEqual([]);
      });
    });
  });
});
