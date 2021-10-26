import { filterOutRequiredValueOnSchemaPropErrors, getLinearErrorPropTree, filterOutErrorsForHiddenProperties } from './event-schemas';

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

  const errors = [error1, error2];

  const uiSchema = {
    'ui:groups': [
      {
        origin: 'fieldset',
        items: ['howdyThere']
      }
    ]
  };

  const filtered = filterOutErrorsForHiddenProperties(errors, uiSchema);

  test('keeping an error if its value is included in the ui:groups', () => {
    expect(filtered).toEqual(expect.arrayContaining([error2]));
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

  it('removes invalid "required should be an array" validation messages', () => {
    expect(filtered).not.toEqual(expect.arrayContaining([error2]));
  });
});
