import { FORM_ELEMENT_TYPES } from '../../../constants';

import transformAttachmentField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformAttachmentField', () => {
  const attachmentFieldId = 'evidence-of-confiscated-items';
  const parentId = 'section-1';
  let jsonSchema, uiSchema;
  beforeEach(() => {
    jsonSchema = {
      properties: {
        [attachmentFieldId]: {
          deprecated: false,
          title: 'Evidence of confiscated items',
        },
      },
      required: [attachmentFieldId],
    };
    uiSchema = {
      fields: {
        [attachmentFieldId]: {
          allowableFileTypes: ['image', 'video'],
          conditionalDependents: ['section-3'],
          parent: parentId,
        },
      },
    };
  });

  it('transforms an attachment field', () => {
    const fields = {};
    transformAttachmentField(attachmentFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: ['image', 'video'],
          conditionalDependents: ['section-3'],
          isActive: true,
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldId,
        },
        id: attachmentFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
  });

  it('transforms an attachment field with no allowable file types', () => {
    uiSchema.fields[attachmentFieldId].allowableFileTypes = [];

    const fields = {};
    transformAttachmentField(attachmentFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: [],
          conditionalDependents: ['section-3'],
          isActive: true,
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldId,
        },
        id: attachmentFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
  });

  it('transforms an attachment field with no conditional dependents', () => {
    uiSchema.fields[attachmentFieldId].conditionalDependents = [];

    const fields = {};
    transformAttachmentField(attachmentFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: ['image', 'video'],
          conditionalDependents: [],
          isActive: true,
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldId,
        },
        id: attachmentFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
  });

  it('transforms an inactive attachment field', () => {
    jsonSchema.properties[attachmentFieldId].deprecated = true;

    const fields = {};
    transformAttachmentField(attachmentFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: ['image', 'video'],
          conditionalDependents: ['section-3'],
          isActive: false,
          isRequired: true,
          label: 'Evidence of confiscated items',
          value: attachmentFieldId,
        },
        id: attachmentFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
  });

  it('transforms a non-required attachment field', () => {
    jsonSchema.required = [];

    const fields = {};
    transformAttachmentField(attachmentFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: ['image', 'video'],
          conditionalDependents: ['section-3'],
          isActive: true,
          isRequired: false,
          label: 'Evidence of confiscated items',
          value: attachmentFieldId,
        },
        id: attachmentFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
  });

  it('transforms an attachment field with no label', () => {
    jsonSchema.properties[attachmentFieldId].title = '';

    const fields = {};
    transformAttachmentField(attachmentFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: ['image', 'video'],
          conditionalDependents: ['section-3'],
          isActive: true,
          isRequired: true,
          label: '',
          value: attachmentFieldId,
        },
        id: attachmentFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
  });

  it('transforms an attachment field with missing properties', () => {
    delete jsonSchema.properties[attachmentFieldId].deprecated;
    delete jsonSchema.properties[attachmentFieldId].title;
    delete uiSchema.fields[attachmentFieldId].allowableFileTypes;
    delete uiSchema.fields[attachmentFieldId].conditionalDependents;

    const fields = {};
    transformAttachmentField(attachmentFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [attachmentFieldId]: {
        details: {
          allowableFileTypes: [],
          conditionalDependents: [],
          isActive: true,
          isRequired: true,
          label: '',
          value: attachmentFieldId,
        },
        id: attachmentFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
    });
  });
});
