import {
  filterOutEnumErrorsForClearedFields,
  filterOutErrorsForHiddenProperties,
  filterOutRequiredValueOnSchemaPropErrors,
  getLinearErrorPropTree,
} from './event-schemas';

describe('getLinearErrorPropTree', () => {
  const errorPropTree = '.properties[\'reportcounty\'].enum';

  test('extracting the field\'s property name from the error "property" prop tree', () => {
    expect(getLinearErrorPropTree(errorPropTree)).toEqual(['reportcounty']);
  });

  test('building the array for multi-dimensional objects', () => {
    const complexErrorPropTree = '.properties[\'reportcounty\'].properties[\'kittycat\'].properties[\'wowneat\'].enum';

    expect(getLinearErrorPropTree(complexErrorPropTree)).toEqual(['reportcounty', 'kittycat', 'wowneat']);

  });
});

describe('filterOutErrorsForHiddenProperties', () => {
  const error1 = {
    'name': 'minItems',
    'property': '.properties[\'reportcounty\'].enum',
    'message': 'should NOT have fewer than 1 items',
    'params': {
      'limit': 1
    },
    'stack': '.properties[\'reportcounty\'].enum should NOT have fewer than 1 items',
    'schemaPath': '#/properties/enum/minItems'
  };

  const error2 = {
    'name': 'minItems',
    'property': '.properties[\'howdyThere\'].enum',
    'message': 'should NOT have fewer than 1 items',
    'params': {
      'limit': 1
    },
    'stack': '.properties[\'howdyThere\'].enum should NOT have fewer than 1 items',
    'schemaPath': '#/properties/enum/minItems'
  };

  const error3 = {
    'name': 'minItems',
    'property': '.properties[\'i_belong_elsewhere\'].enum',
    'message': 'should NOT have fewer than 1 items',
    'params': {
      'limit': 1
    },
    'stack': '.properties[\'i_belong_elsewhere\'].enum should NOT have fewer than 1 items',
    'schemaPath': '#/properties/enum/minItems'
  };

  const error4 = {
    'name': 'minItems',
    'property': '.properties[\'yesPleaseOk\'].enum',
    'message': 'should NOT have fewer than 1 items',
    'params': {
      'limit': 1
    },
    'stack': '.properties[\'yesPleaseOk\'].enum should NOT have fewer than 1 items',
    'schemaPath': '#/properties/enum/minItems'
  };

  const errors = [error1, error2, error3, error4];

  const uiSchema = {
    'ui:groups': [
      {
        origin: 'fieldset',
        items: ['howdyThere', 'yesPleaseOk']
      },
      {
        origin: 'fieldset',
        items: ['i_belong_elsewhere']
      }
    ]
  };

  const filtered = filterOutErrorsForHiddenProperties(errors, uiSchema);

  test('keeping an error if its value is included in the ui:groups', () => {
    expect(filtered).toEqual(expect.arrayContaining([error2, error3, error4]));
  });
  test('removing an error if its value is NOT included in the ui:groups', () => {
    expect(filtered).not.toEqual(expect.arrayContaining([error1]));
  });
});

describe('filterOutRequiredValueOnSchemaPropErrors', () => {
  const error1 = {
    'name': 'minItems',
    'property': '.properties[\'reportcounty\'].enum',
    'message': 'should NOT have fewer than 1 items',
    'params': {
      'limit': 1
    },
    'stack': '.properties[\'reportcounty\'].enum should NOT have fewer than 1 items',
    'schemaPath': '#/properties/enum/minItems'
  };

  const error2 = {
    'name': 'requiredArray',
    'property': '.properties[\'howdyThere\']',
    'message': 'required should be array',
    'stack': '.properties[\'howdyThere\'].enum should be an array',
    'schemaPath': '#/properties/requiredArray'
  };

  const filtered = filterOutRequiredValueOnSchemaPropErrors([error1, error2]);

  test('removing invalid "required should be an array" validation messages', () => {
    expect(filtered).not.toEqual(expect.arrayContaining([error2]));
  });

  test('preserving other error messages', () => {
    expect(filtered).toEqual(expect.arrayContaining([error1]));
  });
});

describe('filterOutEnumErrorsForClearedFields', () => {
  const clearedFieldError = {
    'name': 'enum',
    'property': '.single_select',
    'message': 'must be equal to one of the allowed values',
    'params': { 'allowedValues': ['new', 'old'] },
    'stack': '\'I\'m a single select query\' must be equal to one of the allowed values',
    'schemaPath': '#/properties/single_select/enum',
  };

  const genuineEnumError = {
    'name': 'enum',
    'property': '.another_select',
    'message': 'must be equal to one of the allowed values',
    'params': { 'allowedValues': ['new', 'old'] },
    'stack': '\'Another select\' must be equal to one of the allowed values',
    'schemaPath': '#/properties/another_select/enum',
  };

  const otherError = {
    'name': 'minItems',
    'property': '.reportcounty',
    'message': 'should NOT have fewer than 1 items',
    'params': { 'limit': 1 },
    'stack': '.reportcounty should NOT have fewer than 1 items',
    'schemaPath': '#/properties/reportcounty/minItems',
  };

  const eventDetails = { single_select: '', another_select: 'not-a-valid-value' };

  const filtered = filterOutEnumErrorsForClearedFields([clearedFieldError, genuineEnumError, otherError], eventDetails);

  test('removing an "enum" error for a field whose current value is an empty string', () => {
    expect(filtered).not.toEqual(expect.arrayContaining([clearedFieldError]));
  });

  test('preserving an "enum" error for a field whose current value is not an empty string', () => {
    expect(filtered).toEqual(expect.arrayContaining([genuineEnumError]));
  });

  test('preserving errors that are not "enum" errors', () => {
    expect(filtered).toEqual(expect.arrayContaining([otherError]));
  });

  test('removing an "enum" error for a nested field whose current value is an empty string', () => {
    const nestedClearedFieldError = {
      'name': 'enum',
      'property': '.properties[\'parent\'].properties[\'child\'].enum',
      'message': 'must be equal to one of the allowed values',
      'params': { 'allowedValues': ['new', 'old'] },
      'schemaPath': '#/properties/parent/properties/child/enum',
    };
    const nestedEventDetails = { parent: { child: '' } };

    const nestedFiltered = filterOutEnumErrorsForClearedFields([nestedClearedFieldError], nestedEventDetails);

    expect(nestedFiltered).not.toEqual(expect.arrayContaining([nestedClearedFieldError]));
  });

  test('preserving an "enum" error for a nested field whose current value is not an empty string', () => {
    const nestedGenuineEnumError = {
      'name': 'enum',
      'property': '.properties[\'parent\'].properties[\'child\'].enum',
      'message': 'must be equal to one of the allowed values',
      'params': { 'allowedValues': ['new', 'old'] },
      'schemaPath': '#/properties/parent/properties/child/enum',
    };
    const nestedEventDetails = { parent: { child: 'not-a-valid-value' } };

    const nestedFiltered = filterOutEnumErrorsForClearedFields([nestedGenuineEnumError], nestedEventDetails);

    expect(nestedFiltered).toEqual(expect.arrayContaining([nestedGenuineEnumError]));
  });

  test('not throwing when eventDetails is null', () => {
    expect(() => filterOutEnumErrorsForClearedFields([clearedFieldError], null)).not.toThrow();
  });

  test('removing an "enum" error for a nested field left undefined (onLegacyFormChange does not coerce nested fields to \'\')', () => {
    const nestedClearedFieldError = {
      'name': 'enum',
      'property': '.properties[\'parent\'].properties[\'child\'].enum',
      'message': 'must be equal to one of the allowed values',
      'params': { 'allowedValues': ['new', 'old'] },
      'schemaPath': '#/properties/parent/properties/child/enum',
    };
    const nestedEventDetails = { parent: { child: undefined } };

    const nestedFiltered = filterOutEnumErrorsForClearedFields([nestedClearedFieldError], nestedEventDetails);

    expect(nestedFiltered).not.toEqual(expect.arrayContaining([nestedClearedFieldError]));
  });

  test('preserving an "enum" error for a cleared field that the schema marks as required', () => {
    const requiredFieldError = {
      'name': 'enum',
      'property': '.single_select',
      'message': 'must be equal to one of the allowed values',
      'params': { 'allowedValues': ['new', 'old'] },
      'schemaPath': '#/properties/single_select/enum',
    };
    const schema = { type: 'object', properties: { single_select: {} }, required: ['single_select'] };

    const requiredFiltered = filterOutEnumErrorsForClearedFields([requiredFieldError], eventDetails, schema);

    expect(requiredFiltered).toEqual(expect.arrayContaining([requiredFieldError]));
  });

  test('removing an "enum" error for a cleared field the schema does not require, even when a schema is supplied', () => {
    const schema = { type: 'object', properties: { single_select: {} }, required: [] };

    const optionalFiltered = filterOutEnumErrorsForClearedFields([clearedFieldError], eventDetails, schema);

    expect(optionalFiltered).not.toEqual(expect.arrayContaining([clearedFieldError]));
  });

  test('preserving an "enum" error for a cleared nested field that the schema marks as required', () => {
    const nestedRequiredFieldError = {
      'name': 'enum',
      'property': '.properties[\'parent\'].properties[\'child\'].enum',
      'message': 'must be equal to one of the allowed values',
      'params': { 'allowedValues': ['new', 'old'] },
      'schemaPath': '#/properties/parent/properties/child/enum',
    };
    const nestedEventDetails = { parent: { child: '' } };
    const schema = {
      type: 'object',
      properties: { parent: { type: 'object', properties: { child: {} }, required: ['child'] } },
    };

    const nestedFiltered = filterOutEnumErrorsForClearedFields([nestedRequiredFieldError], nestedEventDetails, schema);

    expect(nestedFiltered).toEqual(expect.arrayContaining([nestedRequiredFieldError]));
  });

  test('preserving an "enum" error for a cleared field required inside an array item\'s schema', () => {
    const arrayItemRequiredFieldError = {
      'name': 'enum',
      'property': '.properties[\'incidents\'][0].properties[\'severity\'].enum',
      'message': 'must be equal to one of the allowed values',
      'params': { 'allowedValues': ['minor', 'major'] },
      'schemaPath': '#/properties/incidents/items/properties/severity/enum',
    };
    const arrayEventDetails = { incidents: [{ severity: '' }] };
    const schema = {
      type: 'object',
      properties: {
        incidents: {
          type: 'array',
          items: { type: 'object', properties: { severity: {} }, required: ['severity'] },
        },
      },
    };

    const arrayFiltered = filterOutEnumErrorsForClearedFields([arrayItemRequiredFieldError], arrayEventDetails, schema);

    expect(arrayFiltered).toEqual(expect.arrayContaining([arrayItemRequiredFieldError]));
  });
});
