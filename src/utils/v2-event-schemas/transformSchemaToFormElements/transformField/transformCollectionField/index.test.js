import UndefinedFormElementError from '../../UndefinedFormElementError';

import transformCollectionField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformCollectionField', () => {
  const transformField = jest.fn();

  const collectionFieldId = 'witnesses';
  let formElements, items, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {
      [collectionFieldId]: {
        details: {
          isRequired: true,
          label: 'Witnesses',
          value: collectionFieldId,
        },
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
    jsonSchema.properties[collectionFieldId].items.properties['witness-age'].deprecated = true;

    transformCollectionField(collectionFieldId, jsonSchema, uiSchema, formElements, transformField);

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

  it('transforms a collection field with no buttonText', () => {
    uiSchema.fields[collectionFieldId].buttonText = '';

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
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms a single column collection field', () => {
    uiSchema.fields[collectionFieldId].columns = 1;

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
          columns: 1,
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
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms a collection field with no description', () => {
    jsonSchema.properties[collectionFieldId].description = '';

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
          description: '',
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
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms a collection field with no itemIdentifier', () => {
    uiSchema.fields[collectionFieldId].itemIdentifier = '';

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
          itemIdentifier: '',
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms a collection field with no itemName', () => {
    uiSchema.fields[collectionFieldId].itemName = '';

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
          itemName: '',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms a collection field with empty leftColumn', () => {
    uiSchema.fields[collectionFieldId].leftColumn = [];

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
          leftColumn: [],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
      },
    });
    expect(transformField).toHaveBeenCalledTimes(1);
    expect(transformField).toHaveBeenCalledWith(
      'witness-age',
      items,
      uiSchema,
      formElements,
    );
  });

  it('transforms a collection field with empty right column', () => {
    uiSchema.fields[collectionFieldId].rightColumn = [];

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

  it('throws an error when a collection child is missing from uiSchema.fields', () => {
    delete uiSchema.fields['witness-name'];

    expect(() => transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      formElements,
      transformField,
    )).toThrow(UndefinedFormElementError);
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
          isRequired: true,
          itemIdentifier: '',
          itemName: '',
          label: 'Witnesses',
          leftColumn: [],
          maxItems: null,
          minItems: null,
          rightColumn: [],
          value: collectionFieldId,
        },
      },
    });
    expect(transformField).not.toHaveBeenCalled();
  });
});
