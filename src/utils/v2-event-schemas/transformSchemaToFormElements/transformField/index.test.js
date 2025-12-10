import { FORM_ELEMENT_TYPES } from '../../constants';
import InvalidFormElementTypeError from '../InvalidFormElementTypeError';
import transformAttachmentField from './transformAttachmentField';
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
  const fieldId = 'field-1';
  const parentId = 'section-1';
  let formElements, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {};
    jsonSchema = {
      properties: {
        [fieldId]: {
          title: 'Name',
        },
      },
      required: [fieldId],
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
    jsonSchema.properties[fieldId].title = 'Evidence of confiscated items';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.ATTACHMENT;

    transformField(fieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: fieldId,
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
    expect(transformAttachmentField).toHaveBeenCalledTimes(1);
    expect(transformAttachmentField).toHaveBeenCalledWith(
      fieldId,
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
    jsonSchema.properties[fieldId].title = 'Damaged source';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.CHOICE_LIST;

    transformField(fieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Damaged source',
          value: fieldId,
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformChoiceListField).toHaveBeenCalledTimes(1);
    expect(transformChoiceListField).toHaveBeenCalledWith(
      fieldId,
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
    jsonSchema.properties[fieldId].title = 'Witnesses';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.COLLECTION;

    transformField(fieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Witnesses',
          value: fieldId,
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).toHaveBeenCalledTimes(1);
    expect(transformCollectionField).toHaveBeenCalledWith(
      fieldId,
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
    jsonSchema.properties[fieldId].title = 'Date of birth';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.DATE_TIME;

    transformField(fieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Date of birth',
          value: fieldId,
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).toHaveBeenCalledTimes(1);
    expect(transformDateTimeField).toHaveBeenCalledWith(
      fieldId,
      jsonSchema,
      uiSchema,
      formElements,
    );
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a location field', () => {
    jsonSchema.properties[fieldId].title = 'Weapon location';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.LOCATION;

    transformField(fieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Weapon location',
          value: fieldId,
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).toHaveBeenCalledTimes(1);
    expect(transformLocationField).toHaveBeenCalledWith(
      fieldId,
      jsonSchema,
      uiSchema,
      formElements,
    );
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a numeric field', () => {
    jsonSchema.properties[fieldId].title = 'Number of snares';
    uiSchema.fields[fieldId].type = FORM_ELEMENT_TYPES.NUMERIC;

    transformField(fieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Number of snares',
          value: fieldId,
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).toHaveBeenCalledTimes(1);
    expect(transformNumericField).toHaveBeenCalledWith(
      fieldId,
      jsonSchema,
      uiSchema,
      formElements,
    );
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a text field', () => {
    transformField(fieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: 'Name',
          value: fieldId,
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).toHaveBeenCalledTimes(1);
    expect(transformTextField).toHaveBeenCalledWith(
      fieldId,
      jsonSchema,
      uiSchema,
      formElements,
    );
  });

  it('transforms a non-required field', () => {
    jsonSchema.required = [];

    transformField(fieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: false,
          label: 'Name',
          value: fieldId,
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a field with no label', () => {
    jsonSchema.properties[fieldId].title = '';

    transformField(fieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: '',
          value: fieldId,
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a field with missing label', () => {
    delete jsonSchema.properties[fieldId].title;

    transformField(fieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [fieldId]: {
        details: {
          isRequired: true,
          label: '',
          value: fieldId,
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('throws an error if the field type is invalid', () => {
    uiSchema.fields[fieldId].type = 'INVALID';

    expect(() => transformField(fieldId, jsonSchema, uiSchema, formElements)).toThrow(
      InvalidFormElementTypeError,
    );
  });
});
