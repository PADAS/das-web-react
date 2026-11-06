import fs from 'fs';
import path from 'path';

import { SUPPORTED_LANGUAGES } from './constants';

const FILES = ['components.json', 'menu-drawer.json'];
const LOCALES_DIR = path.join(__dirname, '../public/locales');

const collectValues = (node) => (typeof node === 'string'
  ? [node]
  : Object.values(node).flatMap(collectValues));

describe('i18n', () => {
  test('has a locale folder for every supported language', () => {
    expect(fs.readdirSync(LOCALES_DIR).sort()).toEqual(Object.keys(SUPPORTED_LANGUAGES).sort());
  });

  Object.keys(SUPPORTED_LANGUAGES).forEach((locale) => {
    FILES.forEach((file) => {
      test(`does not name Otus in any ${locale} ${file} value`, () => {
        const json = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, locale, file), 'utf8'));

        expect(collectValues(json).filter((value) => /otus/i.test(value))).toEqual([]);
      });
    });
  });
});
