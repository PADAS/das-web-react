import { FORM_ELEMENT_TYPES } from '../../../utils/form-schemas/constants';

import pruneHiddenFieldErrors from './';

describe('SchemaForm - utils - pruneHiddenFieldErrors', () => {
  const collectionItemsMessage = 'Errors in the collection items';
  const formElements = {
    collection: { type: FORM_ELEMENT_TYPES.COLLECTION },
    'collection.location': { type: FORM_ELEMENT_TYPES.LOCATION },
    'collection.nested': { type: FORM_ELEMENT_TYPES.COLLECTION },
    'collection.nested.visible_grandchild': { type: FORM_ELEMENT_TYPES.TEXT },
    'collection.visible_child': { type: FORM_ELEMENT_TYPES.TEXT },
    location: { type: FORM_ELEMENT_TYPES.LOCATION },
    visible_field: { type: FORM_ELEMENT_TYPES.TEXT },
  };

  const prune = (errors) => pruneHiddenFieldErrors(errors, formElements, collectionItemsMessage);

  test('keeps the errors of fields the form renders', () => {
    const errors = { visible_field: { message: 'Required' } };

    expect(prune(errors)).toEqual(errors);
  });

  test('drops the errors of fields the form does not render', () => {
    expect(prune({
      hidden_field: { message: 'Wrong type' },
      undefined: { message: 'Additional property' },
      visible_field: { message: 'Required' },
    })).toEqual({ visible_field: { message: 'Required' } });
  });

  test('drops the errors of hidden children of a collection item and keeps the visible ones', () => {
    expect(prune({
      collection: {
        message: collectionItemsMessage,
        0: { hidden_child: { message: 'Wrong type' } },
        1: { hidden_child: { message: 'Wrong type' }, visible_child: { message: 'Required' } },
      },
    })).toEqual({
      collection: { message: collectionItemsMessage, 1: { visible_child: { message: 'Required' } } },
    });
  });

  test('drops the collection error when all of its item errors are on hidden children', () => {
    expect(prune({
      collection: { message: collectionItemsMessage, 0: { hidden_child: { message: 'Wrong type' } } },
    })).toEqual({});
  });

  test('keeps the own error of a collection', () => {
    const errors = { collection: { message: 'At least one item is required' } };

    expect(prune(errors)).toEqual(errors);
  });

  test('keeps the own error of a collection whose item errors are all on hidden children', () => {
    expect(prune({
      collection: { message: 'Too many items', 0: { hidden_child: { message: 'Wrong type' } } },
    })).toEqual({ collection: { message: 'Too many items' } });
  });

  test('prunes nested collections', () => {
    expect(prune({
      collection: {
        message: collectionItemsMessage,
        0: {
          nested: {
            message: collectionItemsMessage,
            0: { hidden_grandchild: { message: 'Wrong type' } },
            1: { visible_grandchild: { message: 'Required' }, hidden_grandchild: { message: 'Wrong type' } },
          },
        },
      },
    })).toEqual({
      collection: {
        message: collectionItemsMessage,
        0: { nested: { message: collectionItemsMessage, 1: { visible_grandchild: { message: 'Required' } } } },
      },
    });
  });

  test('keeps the nested errors of a visible location field', () => {
    const errors = { location: { message: 'Errors in the collection items', undefined: { latitude: { message: 'Max' } } } };

    expect(prune(errors)).toEqual(errors);
  });

  test('keeps the nested errors of a visible location field inside a collection item', () => {
    const errors = {
      collection: {
        message: collectionItemsMessage,
        0: {
          location: { message: collectionItemsMessage, undefined: { latitude: { message: 'Max' } } },
        },
      },
    };

    expect(prune(errors)).toEqual(errors);
  });
});
