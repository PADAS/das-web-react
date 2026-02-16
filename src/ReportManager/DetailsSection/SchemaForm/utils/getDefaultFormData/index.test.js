import getDefaultFormData from './';

describe('ReportManager - DetailsSection - SchemaForm - utils - getDefaultFormData', () => {
  const formElements = {
    'field-1': {
      details: {},
    },
    'field-2': {
      details: {
        defaultInput: '',
      },
    },
    'field-3': {
      details: {
        defaultInput: 'default',
      },
    },
    'field-4': {
      details: {
        defaultInput: 0,
      },
    },
    'field-5': {
      details: {
        defaultInput: false,
      },
    },
  };

  test('returns the default form data for the given field ids', () => {
    expect(getDefaultFormData(['field-1'], formElements)).toEqual({});
    expect(getDefaultFormData(['field-2', 'field-3'], formElements)).toEqual({ 'field-3': 'default' });
    expect(getDefaultFormData(['field-1', 'field-2', 'field-3', 'field-4', 'field-5'], formElements)).toEqual({
      'field-3': 'default',
      'field-4': 0,
      'field-5': false,
    });
  });
});
