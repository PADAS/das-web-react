import { FORM_ELEMENT_TYPES } from '../../../constants';

import transformAttachmentField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformAttachmentField', () => {
  const attachmentFieldId = 'evidence-of-confiscated-items';
  const parentId = 'section-1';
  let formElements, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {
      [attachmentFieldId]: {
        details: {
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
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
    transformAttachmentField(
      attachmentFieldId,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: ['image', 'video'],
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
  });

  it('transforms an attachment field with missing properties', () => {
    delete uiSchema.fields[attachmentFieldId].allowableFileTypes;

    transformAttachmentField(
      attachmentFieldId,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: [],
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
  });
});
