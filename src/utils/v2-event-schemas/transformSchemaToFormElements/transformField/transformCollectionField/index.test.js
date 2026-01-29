import { FORM_ELEMENT_TYPES } from '../../../constants';
import UndefinedFormElementError from '../../UndefinedFormElementError';

import transformCollectionField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformCollectionField', () => {
  const transformField = jest.fn();

  const collectionFieldId = 'witnesses';
  const parentId = 'section-1';
  let formElements, items, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {
      [collectionFieldId]: {
        details: {
          isRequired: true,
          label: 'Witnesses',
          value: collectionFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    };
    items = {
      properties: {
        'witness-name': {
          deprecated: false,
        },
        'witness-age': {
          deprecated: false,
        },
      },
    };
    jsonSchema = {
      properties: {
        [collectionFieldId]: {
          description: 'List of witnesses',
          items,
          maxItems: 5,
          minItems: 1,
        },
      },
    };
    uiSchema = {
      fields: {
        [collectionFieldId]: {
          buttonText: 'Add Witness',
          columns: 2,
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          leftColumn: ['witness-name'],
          rightColumn: ['witness-age'],
        },
        'witness-name': {},
        'witness-age': {},
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('throws an error when a collection child is missing from uiSchema.fields', () => {
    delete uiSchema.fields['witness-name'];

    expect(() =>
      transformCollectionField(
        collectionFieldId,
        jsonSchema,
        uiSchema,
        formElements,
        transformField,
      ),
    ).toThrow(UndefinedFormElementError);
  });

  it('transforms a collection field', () => {
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      formElements,
      transformField,
    );

    expect(formElements).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: 'Add Witness',
          columns: 2,
          description: 'List of witnesses',
          isRequired: true,
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
    expect(transformField).toHaveBeenCalledWith(
      'witness-name',
      items,
      uiSchema,
      formElements,
    );
    expect(transformField).toHaveBeenCalledWith(
      'witness-age',
      items,
      uiSchema,
      formElements,
    );
  });

  it('filters out inactive collection field children', () => {
    items.properties['witness-age'].deprecated = true;

    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      formElements,
      transformField,
    );

    expect(formElements).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: 'Add Witness',
          columns: 2,
          description: 'List of witnesses',
          isRequired: true,
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: [],
          value: collectionFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(1);
    expect(transformField).toHaveBeenCalledWith(
      'witness-name',
      items,
      uiSchema,
      formElements,
    );
  });

  it('transforms a collection field with missing properties', () => {
    delete jsonSchema.properties[collectionFieldId].description;
    delete jsonSchema.properties[collectionFieldId].maxItems;
    delete jsonSchema.properties[collectionFieldId].minItems;
    delete uiSchema.fields[collectionFieldId].buttonText;
    delete uiSchema.fields[collectionFieldId].columns;
    delete uiSchema.fields[collectionFieldId].itemIdentifier;
    delete uiSchema.fields[collectionFieldId].itemName;
    delete uiSchema.fields[collectionFieldId].leftColumn;
    delete uiSchema.fields[collectionFieldId].rightColumn;

    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      formElements,
      transformField,
    );

    expect(formElements).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: '',
          columns: 1,
          description: '',
          itemIdentifier: '',
          itemName: '',
          isRequired: true,
          label: 'Witnesses',
          leftColumn: [],
          maxItems: null,
          minItems: null,
          rightColumn: [],
          value: collectionFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).not.toHaveBeenCalled();
  });
});
