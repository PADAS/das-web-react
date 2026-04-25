import {
  FORM_ELEMENT_LOGIC_CONDITION_OPERATORS,
  FORM_ELEMENT_TYPES,
  ROOT_CANVAS_ID,
} from '../../constants';
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
  let formElements, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {};
    jsonSchema = {
      allOf: [
        {
          if: {},
          then: {
            properties: {
              'number-of-vehicles': {
                deprecated: false,
              },
              'number-of-people-involved': {
                deprecated: false,
              },
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
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_EMPTY,
              value: 'car-accident',
            },
            {
              field: 'victim-injuries',
              id: 'condition-2',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EXACTLY,
              value: 'yes',
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

  it('throws an error when a collection child is missing from the section JSON subschema properties', () => {
    delete jsonSchema.allOf[0].then.properties['number-of-vehicles'];

    expect(() =>
      transformSection(sectionId, jsonSchema, uiSchema, formElements),
    ).toThrow(UndefinedFormElementError);
  });

  it('throws an error when a section child field is missing from uiSchema.fields', () => {
    delete uiSchema.fields['number-of-vehicles'];

    expect(() => {
      transformSection(sectionId, jsonSchema, uiSchema, formElements);
    }).toThrow(UndefinedFormElementError);
  });

  it('throws an error when a section child header is missing from uiSchema.headers', () => {
    delete uiSchema.headers['header-1'];

    expect(() => {
      transformSection(sectionId, jsonSchema, uiSchema, formElements);
    }).toThrow(UndefinedFormElementError);
  });

  it('transforms a section', () => {
    transformSection(sectionId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [sectionId]: {
        details: {
          columns: 2,
          conditions: [
            {
              field: 'type',
              id: 'condition-1',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_EMPTY,
              value: 'car-accident',
            },
            {
              field: 'victim-injuries',
              id: 'condition-2',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EXACTLY,
              value: 'yes',
            },
          ],
          label: 'Accident Details',
          leftColumn: ['number-of-vehicles'],
          rightColumn: ['header-1', 'number-of-people-involved'],
        },
        id: sectionId,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
    expect(transformField).toHaveBeenCalledWith(
      'number-of-vehicles',
      null,
      jsonSchema.allOf[0].then,
      uiSchema,
      formElements,
    );
    expect(transformField).toHaveBeenCalledWith(
      'number-of-people-involved',
      null,
      jsonSchema.allOf[0].then,
      uiSchema,
      formElements,
    );
    expect(transformHeader).toHaveBeenCalledTimes(1);
    expect(transformHeader).toHaveBeenCalledWith(
      'header-1',
      uiSchema,
      formElements,
    );
  });

  it('filters out inactive section children', () => {
    jsonSchema.allOf[0].then.properties['number-of-vehicles'].deprecated = true;

    transformSection(sectionId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [sectionId]: {
        details: {
          columns: 2,
          conditions: [
            {
              field: 'type',
              id: 'condition-1',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_EMPTY,
              value: 'car-accident',
            },
            {
              field: 'victim-injuries',
              id: 'condition-2',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EXACTLY,
              value: 'yes',
            },
          ],
          label: 'Accident Details',
          leftColumn: [],
          rightColumn: ['header-1', 'number-of-people-involved'],
        },
        id: sectionId,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(1);
    expect(transformField).toHaveBeenCalledWith(
      'number-of-people-involved',
      null,
      jsonSchema.allOf[0].then,
      uiSchema,
      formElements,
    );
    expect(transformHeader).toHaveBeenCalledTimes(1);
    expect(transformHeader).toHaveBeenCalledWith('header-1', uiSchema, formElements);
  });

  it('transforms a section with no conditions', () => {
    jsonSchema.properties = jsonSchema.allOf[0].then.properties;
    jsonSchema.required = jsonSchema.allOf[0].then.required;
    delete jsonSchema.allOf;
    uiSchema.sections[sectionId].conditions = [];

    transformSection(sectionId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [sectionId]: {
        details: {
          columns: 2,
          conditions: [],
          label: 'Accident Details',
          leftColumn: ['number-of-vehicles'],
          rightColumn: ['header-1', 'number-of-people-involved'],
        },
        id: sectionId,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
    expect(transformField).toHaveBeenCalledWith(
      'number-of-vehicles',
      null,
      jsonSchema,
      uiSchema,
      formElements,
    );
    expect(transformField).toHaveBeenCalledWith(
      'number-of-people-involved',
      null,
      jsonSchema,
      uiSchema,
      formElements,
    );
    expect(transformHeader).toHaveBeenCalledTimes(1);
    expect(transformHeader).toHaveBeenCalledWith(
      'header-1',
      uiSchema,
      formElements,
    );
  });

  it('transforms a section with deprecated condition operator names', () => {
    uiSchema.sections[sectionId].conditions[0].operator = 'HAS_INPUT';
    uiSchema.sections[sectionId].conditions[1].operator = 'INPUT_IS_EXACTLY';

    transformSection(sectionId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [sectionId]: {
        details: {
          columns: 2,
          conditions: [
            {
              field: 'type',
              id: 'condition-1',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_EMPTY,
              value: 'car-accident',
            },
            {
              field: 'victim-injuries',
              id: 'condition-2',
              operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EXACTLY,
              value: 'yes',
            },
          ],
          label: 'Accident Details',
          leftColumn: ['number-of-vehicles'],
          rightColumn: ['header-1', 'number-of-people-involved'],
        },
        id: sectionId,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).toHaveBeenCalledTimes(2);
    expect(transformField).toHaveBeenCalledWith(
      'number-of-vehicles',
      null,
      jsonSchema.allOf[0].then,
      uiSchema,
      formElements,
    );
    expect(transformField).toHaveBeenCalledWith(
      'number-of-people-involved',
      null,
      jsonSchema.allOf[0].then,
      uiSchema,
      formElements,
    );
    expect(transformHeader).toHaveBeenCalledTimes(1);
    expect(transformHeader).toHaveBeenCalledWith(
      'header-1',
      uiSchema,
      formElements,
    );
  });

  it('transforms a section with missing properties', () => {
    delete uiSchema.sections[sectionId].columns;
    delete uiSchema.sections[sectionId].conditions;
    delete uiSchema.sections[sectionId].label;
    delete uiSchema.sections[sectionId].leftColumn;
    delete uiSchema.sections[sectionId].rightColumn;

    transformSection(sectionId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [sectionId]: {
        details: {
          columns: 1,
          conditions: [],
          label: '',
          leftColumn: [],
          rightColumn: [],
        },
        id: sectionId,
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
    expect(transformField).not.toHaveBeenCalled();
    expect(transformHeader).not.toHaveBeenCalled();
  });
});
