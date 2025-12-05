import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from '../../constants';
import transformField from '../transformField';
import transformHeader from '../transformHeader';
import UndefinedFormElementError from '../UndefinedFormElementError';

const getSectionJSONSubschema = (sectionId, jsonSchema, uiSchema) => {
  if (uiSchema.sections[sectionId].conditions?.length > 0) {
    // The section has conditions. The parent JSON subschema is the "then"
    // subschema of the section conditions subschema.
    return jsonSchema.allOf.find(
      (conditionSubschema) => conditionSubschema['x-section'] === sectionId,
    ).then;
  } else {
    // The section does not have conditions. The parent JSON subschema is the
    // root JSON schema.
    return jsonSchema;
  }
};

const transformSection = (sectionId, jsonSchema, uiSchema, formElements) => {
  const sectionUISchema = uiSchema.sections[sectionId];

  // Transform the section's left and right columns.
  const leftColumn =
    sectionUISchema.leftColumn?.map((sectionChild) => sectionChild.name) ?? [];
  const rightColumn =
    sectionUISchema.rightColumn?.map((sectionChild) => sectionChild.name) ?? [];

  // Add the section node to the form elements object.
  formElements[sectionId] = {
    details: {
      columns: sectionUISchema.columns ?? 1,
      conditions: sectionUISchema.conditions ?? [],
      isActive: sectionUISchema.isActive ?? false,
      label: sectionUISchema.label ?? '',
      leftColumn,
      rightColumn,
    },
    id: sectionId,
    isNew: false,
    isSpacer: false,
    parentId: ROOT_CANVAS_ID,
    type: FORM_ELEMENT_TYPES.SECTION,
  };

  // Get the JSON subschema where the section children are defined.
  const sectionJSONSubschema = getSectionJSONSubschema(sectionId, jsonSchema, uiSchema);

  // Transform each section child.
  const sectionChildrenIds = [...leftColumn, ...rightColumn];
  sectionChildrenIds.forEach((sectionChildId) => {
    if (uiSchema.fields[sectionChildId]) {
      transformField(sectionChildId, sectionJSONSubschema, uiSchema, formElements);
    } else if (uiSchema.headers[sectionChildId]) {
      transformHeader(sectionChildId, uiSchema, formElements);
    } else {
      throw new UndefinedFormElementError(sectionChildId, sectionId);
    }
  });
};

export default transformSection;
