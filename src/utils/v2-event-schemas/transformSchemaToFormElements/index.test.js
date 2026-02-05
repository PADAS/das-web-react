import { ROOT_CANVAS_ID } from '../constants';
import transformSection from './transformSection';
import UndefinedFormElementError from './UndefinedFormElementError';

import transformSchemaToFormElements from '.';

jest.mock('./transformSection', () => {
  const actual = jest.requireActual('./transformSection');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

describe('Utils - v2-event-schemas - transformSchemaToFormElements', () => {
  let schema;
  beforeEach(() => {
    schema = {
      json: {},
      ui: {
        order: ['section-1', 'section-2'],
        sections: {
          'section-1': {
            isActive: true,
          },
          'section-2': {
            isActive: true,
          },
        },
      },
    };
  });

  it('throws an error if a section is missing from uiSchema.sections', () => {
    delete schema.ui.sections['section-1'];

    expect(() => transformSchemaToFormElements(schema)).toThrow(
      UndefinedFormElementError,
    );
  });

  it('transforms schema to form elements', () => {
    const formElements = transformSchemaToFormElements(schema);

    expect(formElements).toEqual({
      [ROOT_CANVAS_ID]: {
        details: {
          sections: ['section-1', 'section-2'],
        },
      },
    });
    expect(transformSection).toHaveBeenCalledTimes(2);
    expect(transformSection).toHaveBeenCalledWith(
      'section-1',
      schema.json,
      schema.ui,
      formElements,
    );
    expect(transformSection).toHaveBeenCalledWith(
      'section-2',
      schema.json,
      schema.ui,
      formElements,
    );
  });

  it('filters out inactive sections', () => {
    schema.ui.sections['section-2'].isActive = false;

    const formElements = transformSchemaToFormElements(schema);

    expect(formElements).toEqual({
      [ROOT_CANVAS_ID]: {
        details: {
          sections: ['section-1'],
        },
      },
    });
    expect(transformSection).toHaveBeenCalledTimes(1);
    expect(transformSection).toHaveBeenCalledWith(
      'section-1',
      schema.json,
      schema.ui,
      formElements,
    );
  });
});
