import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from '../../constants';
import transformField from '../transformField';
import transformHeader from '../transformHeader';
import UndefinedFormElementError from '../UndefinedFormElementError';

const SECTION_CHILD_TYPES = { FIELD: 'field', HEADER: 'header' };

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

  // Get the JSON subschema where the section children are defined.
  const sectionJSONSubschema = getSectionJSONSubschema(sectionId, jsonSchema, uiSchema);

  // Transform the section's columns and filter out inactive children from
  // them.
  const leftColumn = (sectionUISchema.leftColumn ?? [])
    .filter((sectionChild) => sectionChild.type === SECTION_CHILD_TYPES.HEADER
      || !sectionJSONSubschema.properties[sectionChild.name].deprecated)
    .map((sectionChild) => sectionChild.name);
  const rightColumn = (sectionUISchema.rightColumn ?? [])
    .filter((sectionChild) => sectionChild.type === SECTION_CHILD_TYPES.HEADER
      || !sectionJSONSubschema.properties[sectionChild.name].deprecated)
    .map((sectionChild) => sectionChild.name);

  // Add the section node to the form elements object.
  formElements[sectionId] = {
    details: {
      columns: sectionUISchema.columns ?? 1,
      conditions: sectionUISchema.conditions ?? [],
      label: sectionUISchema.label ?? '',
      leftColumn,
      rightColumn,
    },
    parentId: ROOT_CANVAS_ID,
    type: FORM_ELEMENT_TYPES.SECTION,
  };

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
