import transformAttachmentField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformAttachmentField', () => {
  const attachmentFieldId = 'evidence-of-confiscated-items';
  let formElements, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {
      [attachmentFieldId]: {
        details: {
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldId,
        },
      },
    };
    jsonSchema = {
      properties: {
        [attachmentFieldId]: {},
      },
    };
    uiSchema = {
      fields: {
        [attachmentFieldId]: {
          allowableFileTypes: ['image', 'video'],
        },
      },
    };
  });

  it('transforms an attachment field', () => {
    transformAttachmentField(attachmentFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: ['image', 'video'],
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldId,
        },
      },
    });
  });

  it('transforms an attachment field with no allowable file types', () => {
    uiSchema.fields[attachmentFieldId].allowableFileTypes = [];

    transformAttachmentField(attachmentFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: [],
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldId,
        },
      },
    });
  });

  it('transforms an attachment field with missing properties', () => {
    delete uiSchema.fields[attachmentFieldId].allowableFileTypes;

    transformAttachmentField(attachmentFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: [],
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldId,
        },
      },
    });
  });
});
