import { FORM_ELEMENT_TYPES } from '../../../constants';

import transformAttachmentField from '.';

describe('Utils - form-schemas - transformSchemaToFormElements - transformField - transformAttachmentField', () => {
  const attachmentFieldName = 'evidence-of-confiscated-items';
  let attachmentFieldId, formElements, jsonSchema, parentId, uiSchema;
  beforeEach(() => {
    parentId = 'section-1';
    attachmentFieldId = attachmentFieldName;
    formElements = {
      [attachmentFieldId]: {
        details: {
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    };
    jsonSchema = {
      properties: {
        [attachmentFieldName]: {
          description: 'Illegal items carried by the arrestee.',
          maxItems: 5,
          minItems: 1,
        },
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
      attachmentFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: ['image', 'video'],
          description: 'Illegal items carried by the arrestee.',
          isRequired: true,
          label: 'Evidence of confiscated items',
          maxItems: 5,
          minItems: 1,
          value: attachmentFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
  });

  it('transforms an attachment field stored by name in uiSchema.fields', () => {
    parentId = 'collection-1.collection-2';
    attachmentFieldId = `${parentId}.${attachmentFieldName}`;

    formElements = {
      [attachmentFieldId]: {
        details: {
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    };
    uiSchema = {
      fields: {
        [attachmentFieldName]: {
          allowableFileTypes: ['image', 'video'],
        },
      },
    };

    transformAttachmentField(
      attachmentFieldId,
      attachmentFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: ['image', 'video'],
          description: 'Illegal items carried by the arrestee.',
          isRequired: true,
          label: 'Evidence of confiscated items',
          maxItems: 5,
          minItems: 1,
          value: attachmentFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
  });

  it('transforms an attachment field with missing properties', () => {
    delete uiSchema.fields[attachmentFieldId].allowableFileTypes;
    delete jsonSchema.properties[attachmentFieldName].description;
    delete jsonSchema.properties[attachmentFieldName].maxItems;
    delete jsonSchema.properties[attachmentFieldName].minItems;

    transformAttachmentField(
      attachmentFieldId,
      attachmentFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: [],
          description: '',
          isRequired: true,
          label: 'Evidence of confiscated items',
          maxItems: null,
          minItems: null,
          value: attachmentFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
  });
});
