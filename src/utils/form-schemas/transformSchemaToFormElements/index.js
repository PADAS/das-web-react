import { ROOT_CANVAS_ID } from '../constants';
import transformSection from './transformSection';
import UndefinedFormElementError from './UndefinedFormElementError';

export const transformSchemaToFormElements = (schema) => {
  // Throw an error if a section is missing from schema.ui.sections.
  schema.ui.order.forEach((sectionId) => {
    if (!schema.ui.sections[sectionId]) {
      throw new UndefinedFormElementError(sectionId, ROOT_CANVAS_ID);
    }
  });

  // Initialize the formElements object with the active sections order.
  const formElements = {
    [ROOT_CANVAS_ID]: {
      details: {
        sections: schema.ui.order.filter((sectionId) => schema.ui.sections[sectionId].isActive),
      },
    },
  };

  // Transform each section.
  formElements[ROOT_CANVAS_ID].details.sections.forEach((sectionId) =>
    transformSection(sectionId, schema.json, schema.ui, formElements),
  );

  return formElements;
};

export default transformSchemaToFormElements;
