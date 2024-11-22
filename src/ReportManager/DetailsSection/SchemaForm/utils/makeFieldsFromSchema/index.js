import { DATE_TIME_ELEMENT_INPUT_TYPES, FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from '../../constants';

const SECTION_CHILD_TYPES = { FIELD: 'field', HEADER: 'header' };

const addHeaderToFieldsObject = (headerId, fields, uiSchema) => {
  fields[headerId] = {
    details: {
      label: uiSchema.headers[headerId].label,
      size: uiSchema.headers[headerId].size,
    },
    parentId: uiSchema.headers[headerId].section,
    type: FORM_ELEMENT_TYPES.HEADER,
  };
};

const addFieldToFieldsObjectRecursively = (
  fieldId,
  fields,
  jsonSubschema,
  uiSchema,
) => {
  // First we add the common properties.
  fields[fieldId] = {
    details: {
      isRequired: jsonSubschema.required.some(
        (requiredField) => requiredField === fieldId,
      ),
      label: jsonSubschema.properties[fieldId].title,
      value: fieldId,
    },
    parentId: uiSchema.fields[fieldId].parent,
    type: uiSchema.fields[fieldId].type,
  };

  // Then we add the specific properties for each form element type.
  if (fields[fieldId].type === FORM_ELEMENT_TYPES.ATTACHMENT) {
    fields[fieldId].details.allowableFileTypes =
      uiSchema.fields[fieldId].allowableFileTypes;
  } else if (fields[fieldId].type === FORM_ELEMENT_TYPES.CHOICE_LIST) {
    fields[fieldId].details.inputType = uiSchema.fields[fieldId].inputType;
    fields[fieldId].details.choices = uiSchema.fields[fieldId].choices;
    fields[fieldId].details.description =
      jsonSubschema.properties[fieldId].description;
    fields[fieldId].details.hint = uiSchema.fields[fieldId].placeholder;
    fields[fieldId].details.multiple =
      jsonSubschema.properties[fieldId].type === 'array';
  } else if (fields[fieldId].type === FORM_ELEMENT_TYPES.COLLECTION) {
    // Collections are the only field that doesn't have the required flag.
    delete fields[fieldId].details.isRequired;

    const itemsJSONSubschema = jsonSubschema.properties[fieldId].items;

    // When extracting the collection columns, we filter out the inactive children.
    fields[fieldId].details.buttonText = uiSchema.fields[fieldId].buttonText;
    fields[fieldId].details.columns = uiSchema.fields[fieldId].columns;
    fields[fieldId].details.itemIdentifier =
      uiSchema.fields[fieldId].itemIdentifier;
    fields[fieldId].details.itemName = uiSchema.fields[fieldId].itemName;
    fields[fieldId].details.leftColumn = uiSchema.fields[fieldId].leftColumn
      .filter((collectionChildId) => !itemsJSONSubschema.properties[collectionChildId].deprecated);
    fields[fieldId].details.maxItems =
      jsonSubschema.properties[fieldId].maxItems === undefined
        ? ''
        : jsonSubschema.properties[fieldId].maxItems;
    fields[fieldId].details.minItems =
      jsonSubschema.properties[fieldId].minItems === undefined
        ? ''
        : jsonSubschema.properties[fieldId].minItems;
    fields[fieldId].details.rightColumn = uiSchema.fields[fieldId].rightColumn
      .filter((collectionChildId) => !itemsJSONSubschema.properties[collectionChildId].deprecated);

    // We add the collection children recursively.
    const collectionChildren = [
      ...fields[fieldId].details.leftColumn,
      ...fields[fieldId].details.rightColumn,
    ];
    collectionChildren.forEach((collectionChildId) => {
      addFieldToFieldsObjectRecursively(
        collectionChildId,
        fields,
        itemsJSONSubschema,
        uiSchema,
      );
    });
  } else if (fields[fieldId].type === FORM_ELEMENT_TYPES.DATE_TIME) {
    const DATE_SCHEMA_FORMAT_TO_INPUT_TYPE = {
      'date-time': DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
      date: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
      time: DATE_TIME_ELEMENT_INPUT_TYPES.TIME,
    };
    fields[fieldId].details.inputType =
      DATE_SCHEMA_FORMAT_TO_INPUT_TYPE[
        jsonSubschema.properties[fieldId].format
      ];
    fields[fieldId].details.description =
      jsonSubschema.properties[fieldId].description;
  } else if (fields[fieldId].type === FORM_ELEMENT_TYPES.LOCATION) {
    fields[fieldId].details.description =
      jsonSubschema.properties[fieldId].description;
  } else if (fields[fieldId].type === FORM_ELEMENT_TYPES.NUMERIC) {
    fields[fieldId].details.defaultInput =
      jsonSubschema.properties[fieldId].default === undefined
        ? ''
        : jsonSubschema.properties[fieldId].default;
    fields[fieldId].details.description =
      jsonSubschema.properties[fieldId].description;
    fields[fieldId].details.hint = uiSchema.fields[fieldId].placeholder;
    fields[fieldId].details.maxInput =
      jsonSubschema.properties[fieldId].maximum === undefined
        ? ''
        : jsonSubschema.properties[fieldId].maximum;
    fields[fieldId].details.minInput =
      jsonSubschema.properties[fieldId].minimum === undefined
        ? ''
        : jsonSubschema.properties[fieldId].minimum;
  } else if (fields[fieldId].type === FORM_ELEMENT_TYPES.TEXT) {
    fields[fieldId].details.inputType = uiSchema.fields[fieldId].inputType;
    fields[fieldId].details.defaultInput =
      jsonSubschema.properties[fieldId].default;
    fields[fieldId].details.description =
      jsonSubschema.properties[fieldId].description;
    fields[fieldId].details.placeholder = uiSchema.fields[fieldId].placeholder;
  }
};

const addSectionToFieldsObject = (sectionId, fields, jsonSchema, uiSchema) => {
  // We add the section to the fields, filtering its inactive children out.
  fields[sectionId] = {
    details: {
      columns: uiSchema.sections[sectionId].columns,
      label: uiSchema.sections[sectionId].label,
      leftColumn: uiSchema.sections[sectionId].leftColumn
        .filter((sectionChild) => sectionChild.type === SECTION_CHILD_TYPES.HEADER
          || !jsonSchema.properties[sectionChild.name].deprecated)
        .map((sectionChild) => sectionChild.name),
      rightColumn: uiSchema.sections[sectionId].rightColumn
        .filter((sectionChild) => sectionChild.type === SECTION_CHILD_TYPES.HEADER
          || !jsonSchema.properties[sectionChild.name].deprecated)
        .map((sectionChild) => sectionChild.name),
    },
    parentId: ROOT_CANVAS_ID,
    type: FORM_ELEMENT_TYPES.SECTION,
  };

  // Then we add its active children.
  const sectionChildren = [
    ...fields[sectionId].details.leftColumn,
    ...fields[sectionId].details.rightColumn,
  ];
  sectionChildren.forEach((sectionChildId) => {
    if (uiSchema.fields[sectionChildId]) {
      // If the child is a field, we add it and its active children too.
      addFieldToFieldsObjectRecursively(
        sectionChildId,
        fields,
        jsonSchema,
        uiSchema,
      );
    } else if (uiSchema.headers[sectionChildId]) {
      // Headers can't be inactive so we always add them.
      addHeaderToFieldsObject(sectionChildId, fields, uiSchema);
    }
  });
};

export const makeFieldsFromSchema = (schema) => {
  // First, we create the root canvas with the active sections it contains.
  const fields = {
    [ROOT_CANVAS_ID]: {
      details: {
        fields: schema.ui.order.filter((sectionId) => schema.ui.sections[sectionId].isActive),
      },
    },
  };

  // Then we add the active sections one by one.
  Object.keys(schema.ui.sections)
    .filter((sectionId) => schema.ui.sections[sectionId].isActive)
    .forEach((sectionId) => addSectionToFieldsObject(sectionId, fields, schema.json, schema.ui));

  return fields;
};

export default makeFieldsFromSchema;
