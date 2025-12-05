import { ROOT_CANVAS_ID } from '../constants';
import transformSection from './transformSection';
import UndefinedFormElementError from './UndefinedFormElementError';

export const transformSchemaToFormElements = (schema) => {
  // Initialize the form elements object with the root canvas.
  const formElements = {
    [ROOT_CANVAS_ID]: { details: { sections: schema.ui.order } },
  };

  // Transform each section.
  formElements[ROOT_CANVAS_ID].details.sections.forEach((sectionId) => {
    if (schema.ui.sections[sectionId]) {
      transformSection(sectionId, schema.json, schema.ui, formElements);
    } else {
      throw new UndefinedFormElementError(sectionId, ROOT_CANVAS_ID);
    }
  });

  return formElements;
};

export default transformSchemaToFormElements;
