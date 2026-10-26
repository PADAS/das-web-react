import getDefaultFormData from './';

describe('SchemaForm - utils - getDefaultFormData', () => {
  const formElements = {
    'field-1': {
      details: {
        value: 'field-1',
      },
    },
    'field-2': {
      details: {
        defaultInput: '',
        value: 'field-2',
      },
    },
    'field-3': {
      details: {
        defaultInput: 'default',
        value: 'field-3',
      },
    },
    'field-4': {
      details: {
        defaultInput: 0,
        value: 'field-4',
      },
    },
    'field-5': {
      details: {
        defaultInput: false,
        value: 'field-5',
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
