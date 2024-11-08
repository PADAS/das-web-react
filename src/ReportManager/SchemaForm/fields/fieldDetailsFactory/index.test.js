import { textFieldDetailsFactory } from './index';

describe('ReportManager - SchemaForm - fieldDetailsFactory', () => {

  test('builds details object of text field properly', () => {
    const schemaDetails = {
      description: 'A hint of the field',
      title: 'Important Text',
      deprecated: true,
      default: 'initial value'
    };
    const uiDetails = {
      inputType: 'SHORT_TEXT',
      placeholder: 'Ex: some text',
      isRequired: true
    };

    expect(
      textFieldDetailsFactory(schemaDetails, uiDetails, 'input value', 'REQUIRED')
    ).toEqual({
      defaultInput: 'initial value',
      description: 'A hint of the field',
      inputType: 'SHORT_TEXT',
      isActive: false,
      isRequired: true,
      label: 'Important Text',
      placeholder: 'Ex: some text',
      value: 'input value',
      error: 'REQUIRED'
    });
  });
});
