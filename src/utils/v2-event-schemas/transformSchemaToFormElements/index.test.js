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
          'section-1': {},
          'section-2': {},
        },
      },
    };
  });

  it('transforms a schema to fields', () => {
    const fields = transformSchemaToFormElements(schema);

    expect(fields).toEqual({
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
      fields,
    );
    expect(transformSection).toHaveBeenCalledWith(
      'section-2',
      schema.json,
      schema.ui,
      fields,
    );
  });

  it('throws an error when a section is missing from uiSchema.sections', () => {
    delete schema.ui.sections['section-1'];

    expect(() => {
      transformSchemaToFormElements(schema);
    }).toThrow(UndefinedFormElementError);
  });
});
