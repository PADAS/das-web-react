import {
  FORM_ELEMENT_LOGIC_CONDITION_OPERATORS,
  FORM_ELEMENT_TYPES,
  ROOT_CANVAS_ID,
} from '../../constants';
import transformField from '../transformField';
import transformHeader from '../transformHeader';
import UndefinedFormElementError from '../UndefinedFormElementError';

const CONDITION_OPERATOR_MIGRATIONS = {
  DOES_NOT_HAVE_INPUT: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EMPTY,
  HAS_INPUT: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_EMPTY,
  INPUT_IS_EXACTLY: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EXACTLY,
};

const SECTION_CHILD_TYPES = { FIELD: 'field', HEADER: 'header' };

const transformSection = (sectionId, jsonSchema, uiSchema, formElements) => {
  const sectionUISchema = uiSchema.sections[sectionId];

  // If the section has conditions, the JSON schema for the section children is
  // the "then" subschema of the conditional section JSON subschema. Otherwise,
  // it is the root JSON schema.
  const sectionJSONSubschema =
    uiSchema.sections[sectionId].conditions?.length > 0
      ? jsonSchema.allOf.find(
        (conditionalSectionJSONSubschema) =>
          conditionalSectionJSONSubschema['x-section'] === sectionId,
      ).then
      : jsonSchema;

  // Transform the section's columns with only the active children.
  const leftColumn = (sectionUISchema.leftColumn ?? [])
    .filter((sectionChild) => sectionChild.type === SECTION_CHILD_TYPES.HEADER
      || !sectionJSONSubschema.properties[sectionChild.name].deprecated)
    .map((sectionChild) => sectionChild.name);
  const rightColumn = (sectionUISchema.rightColumn ?? [])
    .filter((sectionChild) => sectionChild.type === SECTION_CHILD_TYPES.HEADER
      || !sectionJSONSubschema.properties[sectionChild.name].deprecated)
    .map((sectionChild) => sectionChild.name);

  // Get the section children IDs.
  const sectionChildrenIds = [...leftColumn, ...rightColumn];

  // Throw an error if a section child is missing from uiSchema.fields and
  // uiSchema.headers.
  sectionChildrenIds.forEach((sectionChildId) => {
    if (!uiSchema.fields[sectionChildId] && !uiSchema.headers[sectionChildId]) {
      throw new UndefinedFormElementError(sectionChildId, sectionId);
    }
  });

  // Add the section form element.
  formElements[sectionId] = {
    details: {
      columns: sectionUISchema.columns ?? 1,
      // Some condition operators were renamed. Schemas with old operators are
      // migrated here.
      conditions: (sectionUISchema.conditions ?? []).map((condition) => ({
        ...condition,
        operator:
          CONDITION_OPERATOR_MIGRATIONS[condition.operator] ??
          condition.operator,
      })),
      label: sectionUISchema.label ?? '',
      leftColumn,
      rightColumn,
    },
    parentId: ROOT_CANVAS_ID,
    type: FORM_ELEMENT_TYPES.SECTION,
  };

  // Transform each section child.
  sectionChildrenIds.forEach((sectionChildId) => {
    if (uiSchema.headers[sectionChildId]) {
      transformHeader(sectionChildId, uiSchema, formElements);
    } else {
      transformField(
        sectionChildId,
        sectionJSONSubschema,
        uiSchema,
        formElements,
      );
    }
  });
};

export default transformSection;
