import { FORM_ELEMENT_TYPES } from '../../../../../../utils/form-schemas/constants';
import { GPS_FORMATS } from '../../../../../../utils/location';

import { getItemTitle } from './';

describe('SchemaForm - formElements - Collection - SortableList - Item - utils', () => {
  describe('getItemTitle', () => {
    const t = (_, { collectionLength }) => `${collectionLength} items`;

    test('returns the default value if there is no identifier', () => {
      expect(getItemTitle(
        { identifier: 'identifier value' },
        null,
        'default',
        { type: FORM_ELEMENT_TYPES.TEXT },
        'en-US',
        GPS_FORMATS.DEG,
        t
      )).toBe('default');
    });

    test('returns the default value if the identifier does not have a value', () => {
      expect(getItemTitle(
        {},
        'identifier',
        'default',
        { type: FORM_ELEMENT_TYPES.TEXT },
        'en-US',
        GPS_FORMATS.DEG,
        t
      )).toBe('default');
    });

    test('returns the humanized value of the identifier', () => {
      expect(getItemTitle(
        { identifier: 'identifier value' },
        'identifier',
        'default',
        { type: FORM_ELEMENT_TYPES.TEXT },
        'en-US',
        GPS_FORMATS.DEG,
        t
      )).toBe('identifier value');
    });
  });
});
