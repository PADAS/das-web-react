import { FORM_ELEMENT_LOGIC_CONDITION_OPERATORS, FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from '../../constants';
import transformField from '../transformField';
import transformHeader from '../transformHeader';
import UndefinedFormElementError from '../UndefinedFormElementError';

import transformSection from '.';

jest.mock('../transformField', () => {
  const actual = jest.requireActual('../transformField');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('../transformHeader', () => {
  const actual = jest.requireActual('../transformHeader');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformSection', () => {
  const sectionId = 'section-1';
  let jsonSchema, uiSchema;
  beforeEach(() => {
    jsonSchema = {
      allOf: [
        {
          if: {},
          then: {
            properties: {
              'number-of-vehicles': {},
              'number-of-people-involved': {},
            },
            required: [],
          },
          'x-section': sectionId,
        },
      ],
      properties: {},
      required: [],
    };
    uiSchema = {
      fields: {
        'number-of-vehicles': {},
        'number-of-people-involved': {},
      },
      headers: {
        'header-1': {},
      },
      sections: {
        [sectionId]: {
          columns: 2,
          conditions: [
            {
              field: 'type',
              id: 'condition-1',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.HAS_INPUT,
              value: 'car-accident',
            },
          ],
          isActive: true,
          label: 'Accident Details',
          leftColumn: [
            {
              name: 'number-of-vehicles',
              type: 'field',
            },
          ],
          rightColumn: [
            {
              name: 'header-1',
              type: 'header',
            },
            {
              name: 'number-of-people-involved',
              type: 'field',
            },
          ],
        },
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('transforms a section', () => {
    const fields = {};
    transformSection(sectionId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [sectionId]: {
        details: {
          columns: 2,
          conditions: [
            {
              field: 'type',
              id: 'condition-1',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.HAS_INPUT,
              value: 'car-accident',
            },
          ],
          isActive: true,
          label: 'Accident Details',
          leftColumn: ['number-of-vehicles'],
          rightColumn: ['header-1', 'number-of-people-involved'],
        },
        id: sectionId,
        isNew: false,
        isSpacer: false,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
    expect(transformField).toHaveBeenCalledWith(
      'number-of-vehicles',
      jsonSchema.allOf[0].then,
      uiSchema,
      fields,
    );
    expect(transformField).toHaveBeenCalledWith(
      'number-of-people-involved',
      jsonSchema.allOf[0].then,
      uiSchema,
      fields,
    );
    expect(transformHeader).toHaveBeenCalledTimes(1);
    expect(transformHeader).toHaveBeenCalledWith('header-1', uiSchema, fields);
  });

  it('transforms a single column section', () => {
    uiSchema.sections[sectionId].columns = 1;

    const fields = {};
    transformSection(sectionId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [sectionId]: {
        details: {
          columns: 1,
          conditions: [
            {
              field: 'type',
              id: 'condition-1',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.HAS_INPUT,
              value: 'car-accident',
            },
          ],
          isActive: true,
          label: 'Accident Details',
          leftColumn: ['number-of-vehicles'],
          rightColumn: ['header-1', 'number-of-people-involved'],
        },
        id: sectionId,
        isNew: false,
        isSpacer: false,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
    expect(transformField).toHaveBeenCalledWith(
      'number-of-vehicles',
      jsonSchema.allOf[0].then,
      uiSchema,
      fields,
    );
    expect(transformField).toHaveBeenCalledWith(
      'number-of-people-involved',
      jsonSchema.allOf[0].then,
      uiSchema,
      fields,
    );
    expect(transformHeader).toHaveBeenCalledTimes(1);
    expect(transformHeader).toHaveBeenCalledWith('header-1', uiSchema, fields);
  });

  it('transforms a section with no conditions', () => {
    jsonSchema.properties = jsonSchema.allOf[0].then.properties;
    jsonSchema.required = jsonSchema.allOf[0].then.required;
    delete jsonSchema.allOf;
    uiSchema.sections[sectionId].conditions = [];

    const fields = {};
    transformSection(sectionId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [sectionId]: {
        details: {
          columns: 2,
          conditions: [],
          isActive: true,
          label: 'Accident Details',
          leftColumn: ['number-of-vehicles'],
          rightColumn: ['header-1', 'number-of-people-involved'],
        },
        id: sectionId,
        isNew: false,
        isSpacer: false,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
    expect(transformField).toHaveBeenCalledWith(
      'number-of-vehicles',
      jsonSchema,
      uiSchema,
      fields,
    );
    expect(transformField).toHaveBeenCalledWith(
      'number-of-people-involved',
      jsonSchema,
      uiSchema,
      fields,
    );
    expect(transformHeader).toHaveBeenCalledTimes(1);
    expect(transformHeader).toHaveBeenCalledWith('header-1', uiSchema, fields);
  });

  it('transforms an inactive section', () => {
    uiSchema.sections[sectionId].isActive = false;

    const fields = {};
    transformSection(sectionId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [sectionId]: {
        details: {
          columns: 2,
          conditions: [
            {
              field: 'type',
              id: 'condition-1',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.HAS_INPUT,
              value: 'car-accident',
            },
          ],
          isActive: false,
          label: 'Accident Details',
          leftColumn: ['number-of-vehicles'],
          rightColumn: ['header-1', 'number-of-people-involved'],
        },
        id: sectionId,
        isNew: false,
        isSpacer: false,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
    expect(transformField).toHaveBeenCalledWith(
      'number-of-vehicles',
      jsonSchema.allOf[0].then,
      uiSchema,
      fields,
    );
    expect(transformField).toHaveBeenCalledWith(
      'number-of-people-involved',
      jsonSchema.allOf[0].then,
      uiSchema,
      fields,
    );
    expect(transformHeader).toHaveBeenCalledTimes(1);
    expect(transformHeader).toHaveBeenCalledWith('header-1', uiSchema, fields);
  });

  it('transforms a section with no label', () => {
    uiSchema.sections[sectionId].label = '';

    const fields = {};
    transformSection(sectionId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [sectionId]: {
        details: {
          columns: 2,
          conditions: [
            {
              field: 'type',
              id: 'condition-1',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.HAS_INPUT,
              value: 'car-accident',
            },
          ],
          isActive: true,
          label: '',
          leftColumn: ['number-of-vehicles'],
          rightColumn: ['header-1', 'number-of-people-involved'],
        },
        id: sectionId,
        isNew: false,
        isSpacer: false,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
    expect(transformField).toHaveBeenCalledWith(
      'number-of-vehicles',
      jsonSchema.allOf[0].then,
      uiSchema,
      fields,
    );
    expect(transformField).toHaveBeenCalledWith(
      'number-of-people-involved',
      jsonSchema.allOf[0].then,
      uiSchema,
      fields,
    );
    expect(transformHeader).toHaveBeenCalledTimes(1);
    expect(transformHeader).toHaveBeenCalledWith('header-1', uiSchema, fields);
  });

  it('transforms a section with empty left column', () => {
    uiSchema.sections[sectionId].leftColumn = [];

    const fields = {};
    transformSection(sectionId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [sectionId]: {
        details: {
          columns: 2,
          conditions: [
            {
              field: 'type',
              id: 'condition-1',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.HAS_INPUT,
              value: 'car-accident',
            },
          ],
          isActive: true,
          label: 'Accident Details',
          leftColumn: [],
          rightColumn: ['header-1', 'number-of-people-involved'],
        },
        id: sectionId,
        isNew: false,
        isSpacer: false,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(1);
    expect(transformField).toHaveBeenCalledWith(
      'number-of-people-involved',
      jsonSchema.allOf[0].then,
      uiSchema,
      fields,
    );
    expect(transformHeader).toHaveBeenCalledTimes(1);
    expect(transformHeader).toHaveBeenCalledWith('header-1', uiSchema, fields);
  });

  it('transforms a section with empty right column', () => {
    uiSchema.sections[sectionId].rightColumn = [];

    const fields = {};
    transformSection(sectionId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [sectionId]: {
        details: {
          columns: 2,
          conditions: [
            {
              field: 'type',
              id: 'condition-1',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.HAS_INPUT,
              value: 'car-accident',
            },
          ],
          isActive: true,
          label: 'Accident Details',
          leftColumn: ['number-of-vehicles'],
          rightColumn: [],
        },
        id: sectionId,
        isNew: false,
        isSpacer: false,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(1);
    expect(transformField).toHaveBeenCalledWith(
      'number-of-vehicles',
      jsonSchema.allOf[0].then,
      uiSchema,
      fields,
    );
    expect(transformHeader).not.toHaveBeenCalled();
  });

  it('throws an error when a section child field is missing from uiSchema.fields', () => {
    delete uiSchema.fields['number-of-vehicles'];

    const fields = {};
    expect(() => {
      transformSection(sectionId, jsonSchema, uiSchema, fields);
    }).toThrow(UndefinedFormElementError);
  });

  it('throws an error when a section child header is missing from uiSchema.headers', () => {
    delete uiSchema.headers['header-1'];

    const fields = {};
    expect(() => {
      transformSection(sectionId, jsonSchema, uiSchema, fields);
    }).toThrow(UndefinedFormElementError);
  });

  it('transforms a section with missing properties', () => {
    delete uiSchema.sections[sectionId].columns;
    delete uiSchema.sections[sectionId].conditions;
    delete uiSchema.sections[sectionId].isActive;
    delete uiSchema.sections[sectionId].label;
    delete uiSchema.sections[sectionId].leftColumn;
    delete uiSchema.sections[sectionId].rightColumn;

    const fields = {};
    transformSection(sectionId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [sectionId]: {
        details: {
          columns: 1,
          conditions: [],
          isActive: false,
          label: '',
          leftColumn: [],
          rightColumn: [],
        },
        id: sectionId,
        isNew: false,
        isSpacer: false,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).not.toHaveBeenCalled();
    expect(transformHeader).not.toHaveBeenCalled();
  });
});
