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
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('transforms an attachment field', () => {
    const fieldId = 'evidence-of-confiscated-items';
    const jsonSchema = {
      properties: {
        [fieldId]: {},
      },
      required: [fieldId],
    };
    const uiSchema = {
      fields: {
        [fieldId]: {
          type: FORM_ELEMENT_TYPES.ATTACHMENT,
        },
      },
    };
    const fields = {};
    transformField(fieldId, jsonSchema, uiSchema, fields);

    expect(transformAttachmentField).toHaveBeenCalledTimes(1);
    expect(transformAttachmentField).toHaveBeenCalledWith(
      fieldId,
      jsonSchema,
      uiSchema,
      fields,
    );
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a choice list field', () => {
    const fieldId = 'damaged-source';
    const jsonSchema = {
      properties: {
        [fieldId]: {},
      },
      required: [fieldId],
    };
    const uiSchema = {
      fields: {
        [fieldId]: {
          type: FORM_ELEMENT_TYPES.CHOICE_LIST,
        },
      },
    };
    const fields = {};
    transformField(fieldId, jsonSchema, uiSchema, fields);

    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformChoiceListField).toHaveBeenCalledTimes(1);
    expect(transformChoiceListField).toHaveBeenCalledWith(
      fieldId,
      jsonSchema,
      uiSchema,
      fields,
    );
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a collection field', () => {
    const fieldId = 'witnesses';
    const jsonSchema = {
      properties: {
        [fieldId]: {},
      },
      required: [fieldId],
    };
    const uiSchema = {
      fields: {
        [fieldId]: {
          type: FORM_ELEMENT_TYPES.COLLECTION,
        },
      },
    };
    const fields = {};
    transformField(fieldId, jsonSchema, uiSchema, fields);

    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).toHaveBeenCalledTimes(1);
    expect(transformCollectionField).toHaveBeenCalledWith(
      fieldId,
      jsonSchema,
      uiSchema,
      fields,
      transformField,
    );
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a date time field', () => {
    const fieldId = 'date-of-birth';
    const jsonSchema = {
      properties: {
        [fieldId]: {},
      },
      required: [fieldId],
    };
    const uiSchema = {
      fields: {
        [fieldId]: {
          type: FORM_ELEMENT_TYPES.DATE_TIME,
        },
      },
    };
    const fields = {};
    transformField(fieldId, jsonSchema, uiSchema, fields);

    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).toHaveBeenCalledTimes(1);
    expect(transformDateTimeField).toHaveBeenCalledWith(
      fieldId,
      jsonSchema,
      uiSchema,
      fields,
    );
    expect(transformLocationField).not.toHaveBeenCalled();
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a location field', () => {
    const fieldId = 'weapon-location';
    const jsonSchema = {
      properties: {
        [fieldId]: {},
      },
      required: [fieldId],
    };
    const uiSchema = {
      fields: {
        [fieldId]: {
          type: FORM_ELEMENT_TYPES.LOCATION,
        },
      },
    };
    const fields = {};
    transformField(fieldId, jsonSchema, uiSchema, fields);

    expect(transformAttachmentField).not.toHaveBeenCalled();
    expect(transformChoiceListField).not.toHaveBeenCalled();
    expect(transformCollectionField).not.toHaveBeenCalled();
    expect(transformDateTimeField).not.toHaveBeenCalled();
    expect(transformLocationField).toHaveBeenCalledTimes(1);
    expect(transformLocationField).toHaveBeenCalledWith(
      fieldId,
      jsonSchema,
      uiSchema,
      fields,
    );
    expect(transformNumericField).not.toHaveBeenCalled();
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a numeric field', () => {
    const fieldId = 'number-of-snares';
    const jsonSchema = {
      properties: {
        [fieldId]: {},
      },
      required: [fieldId],
    };
    const uiSchema = {
      fields: {
        [fieldId]: {
          type: FORM_ELEMENT_TYPES.NUMERIC,
        },
      },
    };
    const fields = {};
    transformField(fieldId, jsonSchema, uiSchema, fields);

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
      fields,
    );
    expect(transformTextField).not.toHaveBeenCalled();
  });

  it('transforms a text field', () => {
    const fieldId = 'name';
    const jsonSchema = {
      properties: {
        [fieldId]: {},
      },
      required: [fieldId],
    };
    const uiSchema = {
      fields: {
        [fieldId]: {
          type: FORM_ELEMENT_TYPES.TEXT,
        },
      },
    };
    const fields = {};
    transformField(fieldId, jsonSchema, uiSchema, fields);

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
      fields,
    );
  });

  it('throws an error if the field type is invalid', () => {
    const fieldId = 'invalid-field';
    const jsonSchema = {
      properties: {
        [fieldId]: {},
      },
      required: [fieldId],
    };
    const uiSchema = {
      fields: {
        [fieldId]: {
          type: 'INVALID',
        },
      },
    };
    const fields = {};

    expect(() => transformField(fieldId, jsonSchema, uiSchema, fields)).toThrow(
      InvalidFormElementTypeError,
    );
  });
});
