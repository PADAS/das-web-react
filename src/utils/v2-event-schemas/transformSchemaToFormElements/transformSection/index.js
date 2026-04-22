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

  const leftColumnChildren = sectionUISchema.leftColumn ?? [];
  const rightColumnChildren = sectionUISchema.rightColumn ?? [];
  const sectionChildren = [...leftColumnChildren, ...rightColumnChildren];

  sectionChildren.forEach((sectionChild) => {
    // Section children's ids and names are the same.
    const sectionChildId = sectionChild.name;
    const sectionChildName = sectionChild.name;

    if (sectionChild.type === SECTION_CHILD_TYPES.HEADER && !uiSchema.headers[sectionChildId]) {
      throw new UndefinedFormElementError(sectionChildId, sectionId);
    }

    if (
      sectionChild.type === SECTION_CHILD_TYPES.FIELD &&
      (!sectionJSONSubschema.properties[sectionChildName] ||
        !uiSchema.fields[sectionChildId])
    ) {
      throw new UndefinedFormElementError(sectionChildId, sectionId);
    }
  });

  const leftColumnActiveChildrenIds = leftColumnChildren
    .filter((leftColumnChild) => {
      const leftColumnChildName = leftColumnChild.name;
      return leftColumnChild.type === SECTION_CHILD_TYPES.HEADER
        || !sectionJSONSubschema.properties[leftColumnChildName].deprecated;
    })
    .map((sectionChild) => sectionChild.name);
  const rightColumnActiveChildrenIds = rightColumnChildren
    .filter((rightColumnChild) => {
      const rightColumnChildName = rightColumnChild.name;
      return rightColumnChild.type === SECTION_CHILD_TYPES.HEADER
        || !sectionJSONSubschema.properties[rightColumnChildName].deprecated;
    })
    .map((rightColumnChild) => rightColumnChild.name);

  // Add the section form element.
  formElements[sectionId] = {
    details: {
      columns: sectionUISchema.columns ?? 1,
      // Backwards compatibility: some condition operators were renamed.
      conditions: (sectionUISchema.conditions ?? []).map((condition) => ({
        ...condition,
        operator:
          CONDITION_OPERATOR_MIGRATIONS[condition.operator] ??
          condition.operator,
      })),
      label: sectionUISchema.label ?? '',
      leftColumn: leftColumnActiveChildrenIds,
      rightColumn: rightColumnActiveChildrenIds,
    },
    parentId: ROOT_CANVAS_ID,
    type: FORM_ELEMENT_TYPES.SECTION,
  };

  // Transform each section child.
  const sectionActiveChildrenIds = [
    ...leftColumnActiveChildrenIds,
    ...rightColumnActiveChildrenIds,
  ];
  sectionActiveChildrenIds.forEach((sectionActiveChildId) => {
    if (uiSchema.headers[sectionActiveChildId]) {
      transformHeader(sectionActiveChildId, uiSchema, formElements);
    } else {
      const sectionActiveChildName = sectionActiveChildId;
      transformField(
        sectionActiveChildName,
        null,
        sectionJSONSubschema,
        uiSchema,
        formElements,
      );
    }
  });
};

export default transformSection;
