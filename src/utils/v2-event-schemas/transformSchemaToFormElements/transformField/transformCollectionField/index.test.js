import { FORM_ELEMENT_TYPES } from '../../../constants';
import UndefinedFormElementError from '../../UndefinedFormElementError';

import transformCollectionField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformCollectionField', () => {
  const transformField = jest.fn();

  const collectionFieldName = 'witnesses';
  let collectionFieldId, formElements, items, jsonSchema, parentId, uiSchema;
  beforeEach(() => {
    parentId = 'section-1';
    collectionFieldId = collectionFieldName;
    formElements = {
      [collectionFieldId]: {
        details: {
          isRequired: true,
          label: 'Witnesses',
          value: collectionFieldName,
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
        [collectionFieldName]: {
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
          itemIdentifier: `${collectionFieldId}.witness-name`,
          itemName: 'Witness',
          leftColumn: [`${collectionFieldId}.witness-name`],
          rightColumn: [`${collectionFieldId}.witness-age`],
        },
        [`${collectionFieldId}.witness-name`]: {},
        [`${collectionFieldId}.witness-age`]: {},
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('throws an error when a collection child is missing from uiSchema.fields', () => {
    delete uiSchema.fields[`${collectionFieldId}.witness-name`];

    expect(() =>
      transformCollectionField(
        collectionFieldId,
        collectionFieldName,
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
      collectionFieldName,
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
          itemIdentifier: `${collectionFieldId}.witness-name`,
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: [`${collectionFieldId}.witness-name`],
          maxItems: 5,
          minItems: 1,
          rightColumn: [`${collectionFieldId}.witness-age`],
          value: collectionFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
    expect(transformField).toHaveBeenCalledWith(
      'witness-name',
      collectionFieldId,
      items,
      uiSchema,
      formElements,
    );
    expect(transformField).toHaveBeenCalledWith(
      'witness-age',
      collectionFieldId,
      items,
      uiSchema,
      formElements,
    );
  });

  it('transforms a collection field from a schema that stored fields by name', () => {
    parentId = 'collection-1.collection-2';
    collectionFieldId = `${parentId}.${collectionFieldName}`;

    formElements = {
      [collectionFieldId]: {
        details: {
          isRequired: true,
          label: 'Witnesses',
          value: collectionFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    };
    uiSchema = {
      fields: {
        [collectionFieldName]: {
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

    transformCollectionField(
      collectionFieldId,
      collectionFieldName,
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
          itemIdentifier: `${collectionFieldId}.witness-name`,
          itemName: 'Witness',
          isRequired: true,
          label: 'Witnesses',
          leftColumn: [`${collectionFieldId}.witness-name`],
          maxItems: 5,
          minItems: 1,
          rightColumn: [`${collectionFieldId}.witness-age`],
          value: collectionFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
    expect(transformField).toHaveBeenCalledWith(
      'witness-name',
      collectionFieldId,
      items,
      uiSchema,
      formElements,
    );
    expect(transformField).toHaveBeenCalledWith(
      'witness-age',
      collectionFieldId,
      items,
      uiSchema,
      formElements,
    );
  });

  it('filters out inactive collection field children', () => {
    items.properties['witness-age'].deprecated = true;

    transformCollectionField(
      collectionFieldId,
      collectionFieldName,
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
          itemIdentifier: `${collectionFieldId}.witness-name`,
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: [`${collectionFieldId}.witness-name`],
          maxItems: 5,
          minItems: 1,
          rightColumn: [],
          value: collectionFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(1);
    expect(transformField).toHaveBeenCalledWith(
      'witness-name',
      collectionFieldId,
      items,
      uiSchema,
      formElements,
    );
  });

  it('transforms a collection field with missing properties', () => {
    delete jsonSchema.properties[collectionFieldName].description;
    delete jsonSchema.properties[collectionFieldName].maxItems;
    delete jsonSchema.properties[collectionFieldName].minItems;
    delete uiSchema.fields[collectionFieldId].buttonText;
    delete uiSchema.fields[collectionFieldId].columns;
    delete uiSchema.fields[collectionFieldId].itemIdentifier;
    delete uiSchema.fields[collectionFieldId].itemName;
    delete uiSchema.fields[collectionFieldId].leftColumn;
    delete uiSchema.fields[collectionFieldId].rightColumn;

    transformCollectionField(
      collectionFieldId,
      collectionFieldName,
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
          value: collectionFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).not.toHaveBeenCalled();
  });
});
