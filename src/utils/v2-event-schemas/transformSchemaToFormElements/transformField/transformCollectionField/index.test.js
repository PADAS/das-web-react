import { FORM_ELEMENT_TYPES } from '../../../constants';
import UndefinedFormElementError from '../../UndefinedFormElementError';

import transformCollectionField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformCollectionField', () => {
  const transformField = jest.fn();

  const collectionFieldId = 'witnesses';
  const parentId = 'section-1';
  const items = {};
  let jsonSchema, uiSchema;
  beforeEach(() => {
    jsonSchema = {
      properties: {
        [collectionFieldId]: {
          deprecated: false,
          description: 'List of witnesses',
          items,
          maxItems: 5,
          minItems: 1,
          title: 'Witnesses',
        },
      },
    };
    uiSchema = {
      fields: {
        [collectionFieldId]: {
          buttonText: 'Add Witness',
          columns: 2,
          conditionalDependents: ['section-3'],
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          leftColumn: ['witness-name'],
          rightColumn: ['witness-age'],
          parent: parentId,
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
    const fields = {};
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );

    expect(fields).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: 'Add Witness',
          columns: 2,
          conditionalDependents: ['section-3'],
          description: 'List of witnesses',
          isActive: true,
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
        id: collectionFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
    expect(transformField).toHaveBeenCalledWith(
      'witness-name',
      items,
      uiSchema,
      fields,
    );
    expect(transformField).toHaveBeenCalledWith(
      'witness-age',
      items,
      uiSchema,
      fields,
    );
  });

  it('transforms a collection field with no buttonText', () => {
    uiSchema.fields[collectionFieldId].buttonText = '';

    const fields = {};
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );

    expect(fields).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: '',
          columns: 2,
          conditionalDependents: ['section-3'],
          description: 'List of witnesses',
          isActive: true,
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
        id: collectionFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms a single column collection field', () => {
    uiSchema.fields[collectionFieldId].columns = 1;

    const fields = {};
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );

    expect(fields).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: 'Add Witness',
          columns: 1,
          conditionalDependents: ['section-3'],
          description: 'List of witnesses',
          isActive: true,
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
        id: collectionFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms a collection field with no conditional dependents', () => {
    uiSchema.fields[collectionFieldId].conditionalDependents = [];

    const fields = {};
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );

    expect(fields).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: 'Add Witness',
          columns: 2,
          conditionalDependents: [],
          description: 'List of witnesses',
          isActive: true,
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
        id: collectionFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms a collection field with no description', () => {
    jsonSchema.properties[collectionFieldId].description = '';

    const fields = {};
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );

    expect(fields).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: 'Add Witness',
          columns: 2,
          conditionalDependents: ['section-3'],
          description: '',
          isActive: true,
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
        id: collectionFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms an inactive collection field', () => {
    jsonSchema.properties[collectionFieldId].deprecated = true;

    const fields = {};
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );

    expect(fields).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: 'Add Witness',
          columns: 2,
          conditionalDependents: ['section-3'],
          description: 'List of witnesses',
          isActive: false,
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
        id: collectionFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms a collection field with no itemIdentifier', () => {
    uiSchema.fields[collectionFieldId].itemIdentifier = '';

    const fields = {};
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );

    expect(fields).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: 'Add Witness',
          columns: 2,
          conditionalDependents: ['section-3'],
          description: 'List of witnesses',
          isActive: true,
          itemIdentifier: '',
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
        id: collectionFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms a collection field with no itemName', () => {
    uiSchema.fields[collectionFieldId].itemName = '';

    const fields = {};
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );

    expect(fields).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: 'Add Witness',
          columns: 2,
          conditionalDependents: ['section-3'],
          description: 'List of witnesses',
          isActive: true,
          itemIdentifier: 'witness-name',
          itemName: '',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
        id: collectionFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms a collection field with no label', () => {
    jsonSchema.properties[collectionFieldId].title = '';

    const fields = {};
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );

    expect(fields).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: 'Add Witness',
          columns: 2,
          conditionalDependents: ['section-3'],
          description: 'List of witnesses',
          isActive: true,
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          label: '',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
        id: collectionFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
  });

  it('transforms a collection field with empty leftColumn', () => {
    uiSchema.fields[collectionFieldId].leftColumn = [];

    const fields = {};
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );

    expect(fields).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: 'Add Witness',
          columns: 2,
          conditionalDependents: ['section-3'],
          description: 'List of witnesses',
          isActive: true,
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: [],
          maxItems: 5,
          minItems: 1,
          rightColumn: ['witness-age'],
          value: collectionFieldId,
        },
        id: collectionFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(1);
    expect(transformField).toHaveBeenCalledWith(
      'witness-age',
      items,
      uiSchema,
      fields,
    );
  });

  it('transforms a collection field with empty right column', () => {
    uiSchema.fields[collectionFieldId].rightColumn = [];

    const fields = {};
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );

    expect(fields).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: 'Add Witness',
          columns: 2,
          conditionalDependents: ['section-3'],
          description: 'List of witnesses',
          isActive: true,
          itemIdentifier: 'witness-name',
          itemName: 'Witness',
          label: 'Witnesses',
          leftColumn: ['witness-name'],
          maxItems: 5,
          minItems: 1,
          rightColumn: [],
          value: collectionFieldId,
        },
        id: collectionFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(1);
    expect(transformField).toHaveBeenCalledWith(
      'witness-name',
      items,
      uiSchema,
      fields,
    );
  });

  it('throws an error when a collection child is missing from uiSchema.fields', () => {
    delete uiSchema.fields['witness-name'];

    const fields = {};
    expect(() => {
      transformCollectionField(
        collectionFieldId,
        jsonSchema,
        uiSchema,
        fields,
        transformField,
      );
    }).toThrow(UndefinedFormElementError);
  });

  it('transforms a collection field with missing properties', () => {
    delete jsonSchema.properties[collectionFieldId].description;
    delete jsonSchema.properties[collectionFieldId].deprecated;
    delete jsonSchema.properties[collectionFieldId].maxItems;
    delete jsonSchema.properties[collectionFieldId].minItems;
    delete jsonSchema.properties[collectionFieldId].title;
    delete uiSchema.fields[collectionFieldId].buttonText;
    delete uiSchema.fields[collectionFieldId].columns;
    delete uiSchema.fields[collectionFieldId].conditionalDependents;
    delete uiSchema.fields[collectionFieldId].itemIdentifier;
    delete uiSchema.fields[collectionFieldId].itemName;
    delete uiSchema.fields[collectionFieldId].leftColumn;
    delete uiSchema.fields[collectionFieldId].rightColumn;

    const fields = {};
    transformCollectionField(
      collectionFieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );

    expect(fields).toEqual({
      [collectionFieldId]: {
        details: {
          buttonText: '',
          columns: 1,
          conditionalDependents: [],
          description: '',
          isActive: true,
          itemIdentifier: '',
          itemName: '',
          label: '',
          leftColumn: [],
          maxItems: '',
          minItems: '',
          rightColumn: [],
          value: collectionFieldId,
        },
        id: collectionFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformField).not.toHaveBeenCalled();
  });
});
