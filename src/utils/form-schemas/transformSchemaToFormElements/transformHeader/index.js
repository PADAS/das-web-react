import { FORM_ELEMENT_TYPES, HEADER_ELEMENT_SIZES } from '../../constants';

const transformHeader = (headerId, uiSchema, formElements) => {
  const headerUISchema = uiSchema.headers[headerId];

  // Add the header form element.
  formElements[headerId] = {
    details: {
      label: headerUISchema.label ?? '',
      size: headerUISchema.size ?? HEADER_ELEMENT_SIZES.LARGE,
    },
    id: headerId,
    parentId: headerUISchema.section,
    type: FORM_ELEMENT_TYPES.HEADER,
  };
};

export default transformHeader;
