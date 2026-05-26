import { FORM_ELEMENT_TYPES } from '../../constants';
import InvalidFormElementTypeError from '../InvalidFormElementTypeError';
import transformAttachmentField from './transformAttachmentField';
import transformBooleanField from './transformBooleanField';
import transformChoiceListField from './transformChoiceListField';
import transformCollectionField from './transformCollectionField';
import transformDateTimeField from './transformDateTimeField';
import transformLocationField from './transformLocationField';
import transformNumericField from './transformNumericField';
import transformTextField from './transformTextField';

import transformField from '.';

jest.mock('./transformAttachmentField', () => {
  const actual = jest.requireActual('./transformAttachmentField');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./transformBooleanField', () => {
  const actual = jest.requireActual('./transformBooleanField');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./transformChoiceListField', () => {
  const actual = jest.requireActual('./transformChoiceListField');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./transformCollectionField', () => {
  const actual = jest.requireActual('./transformCollectionField');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./transformDateTimeField', () => {
  const actual = jest.requireActual('./transformDateTimeField');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./transformLocationField', () => {
  const actual = jest.requireActual('./transformLocationField');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./transformNumericField', () => {
  const actual = jest.requireActual('./transformNumericField');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./transformTextField', () => {
  const actual = jest.requireActual('./transformTextField');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField', () => {
  const fieldName = 'field-1';
  let fieldId, formElements, jsonSchema, parentId, uiSchema;
  beforeEach(() => {
    parentId = 'section-1';
    fieldId = fieldName;
    formElements = {};
    jsonSchema = {
      properties: {
        [fieldName]: {
          title: 'Name',
        },
      },
      required: [fieldName],
    };
    uiSchema = {
      fields: {
        [fieldId]: {
          conditionalDependents: ['section-3'],
          parent: parentId,
          type: FORM_ELEMENT_TYPES.TEXT,
        },
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('transforms an attachment field', () => {
    jsonSchema.properties[fieldName].title = 'Evidence of confiscated items';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.ATTACHMENT;

    transformField(fieldName, null, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: fieldName,
        },
        id: fieldId,
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
    expect(transformAttachmentField).toHaveBeenCalledTimes(1);
    expect(transformAttachmentField).toHaveBeenCalledWith(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    expect(transformBooleanField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a boolean field', () => {
    jsonSchema.properties[fieldName].title = 'Is animal injured?';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.BOOLEAN;

    transformField(fieldName, null, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Is animal injured?',
          value: fieldName,
        },
        id: fieldId,
        parentId,
        type: FORM_ELEMENT_TYPES.BOOLEAN,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformBooleanField).toHaveBeenCalledTimes(1);
    expect(transformBooleanField).toHaveBeenCalledWith(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a choice list field', () => {
    jsonSchema.properties[fieldName].title = 'Damaged source';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.CHOICE_LIST;

    transformField(fieldName, null, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Damaged source',
          value: fieldName,
        },
        id: fieldId,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformBooleanField).not.toHaveBeenCalled();
    expect(transformChoiceListField).toHaveBeenCalledTimes(1);
    expect(transformChoiceListField).toHaveBeenCalledWith(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a collection field', () => {
    jsonSchema.properties[fieldName].title = 'Witnesses';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.COLLECTION;

    transformField(fieldName, null, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Witnesses',
          value: fieldName,
        },
        id: fieldId,
        parentId,
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformBooleanField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).toHaveBeenCalledTimes(1);
    expect(transformCollectionField).toHaveBeenCalledWith(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
      transformField,
    );
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a date time field', () => {
    jsonSchema.properties[fieldName].title = 'Date of birth';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.DATE_TIME;

    transformField(fieldName, null, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Date of birth',
          value: fieldName,
        },
        id: fieldId,
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformBooleanField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).toHaveBeenCalledTimes(1);
    expect(transformDateTimeField).toHaveBeenCalledWith(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a location field', () => {
    jsonSchema.properties[fieldName].title = 'Weapon location';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.LOCATION;

    transformField(fieldName, null, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Weapon location',
          value: fieldName,
        },
        id: fieldId,
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformBooleanField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).toHaveBeenCalledTimes(1);
    expect(transformLocationField).toHaveBeenCalledWith(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a numeric field', () => {
    jsonSchema.properties[fieldName].title = 'Number of snares';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.NUMERIC;

    transformField(fieldName, null, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Number of snares',
          value: fieldName,
        },
        id: fieldId,
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformBooleanField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).toHaveBeenCalledTimes(1);
    expect(transformNumericField).toHaveBeenCalledWith(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a text field', () => {
    transformField(fieldName, null, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Name',
          value: fieldName,
        },
        id: fieldId,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformBooleanField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).toHaveBeenCalledTimes(1);
    expect(transformTextField).toHaveBeenCalledWith(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
  });

  it('transforms a field parented by a collection', () => {
    parentId = 'collection-1.collection-2';
    fieldId = `${parentId}.field-1`;

    uiSchema = {
      fields: {
        [fieldId]: {
          conditionalDependents: ['section-3'],
          parent: parentId,
          type: FORM_ELEMENT_TYPES.TEXT,
        },
      },
    };

    transformField(fieldName, parentId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Name',
          value: fieldName,
        },
        id: fieldId,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a field from a schema that stored fields by name', () => {
    const parentName = 'collection-2';
    parentId = `collection-1.${parentName}`;
    fieldId = `${parentId}.${fieldName}`;

    uiSchema = {
      fields: {
        [fieldName]: {
          conditionalDependents: ['section-3'],
          parent: parentName,
          type: FORM_ELEMENT_TYPES.TEXT,
        },
      },
    };

    transformField(fieldName, parentId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Name',
          value: fieldName,
        },
        id: fieldId,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a non-required field', () => {
    jsonSchema.required = [];

    transformField(fieldName, null, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: false,
          label: 'Name',
          value: fieldName,
        },
        id: fieldId,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a field with missing properties', () => {
    delete jsonSchema.properties[fieldName].title;

    transformField(fieldName, null, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: '',
          value: fieldName,
        },
        id: fieldId,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('throws an error if the field type is invalid', () => {
    uiSchema.fields[fieldId].type = 'INVALID';

    expect(() =>
      transformField(fieldName, null, jsonSchema, uiSchema, formElements),
    ).toThrow(InvalidFormElementTypeError);
  });
});
