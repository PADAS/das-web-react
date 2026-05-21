import { FORM_ELEMENT_TYPES, HEADER_ELEMENT_SIZES } from '../../constants';

import transformHeader from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformHeader', () => {
  const headerId = 'header-1';
  const parentId = 'section-1';
  let formElements, uiSchema;
  beforeEach(() => {
    formElements = {};
    uiSchema = {
      headers: {
        [headerId]: {
          label: 'Arrestee Details',
          size: HEADER_ELEMENT_SIZES.MEDIUM,
          section: parentId,
        },
      },
    };
  });

  it('transforms a header', () => {
    transformHeader(headerId, uiSchema, formElements);

    expect(formElements).toEqual({
      [headerId]: {
        details: {
          label: 'Arrestee Details',
          size: HEADER_ELEMENT_SIZES.MEDIUM,
        },
        id: headerId,
        parentId: parentId,
        type: FORM_ELEMENT_TYPES.HEADER,
      },
    });
  });

  it('transforms a header with missing properties', () => {
    delete uiSchema.headers[headerId].label;
    delete uiSchema.headers[headerId].size;

    transformHeader(headerId, uiSchema, formElements);

    expect(formElements).toEqual({
      [headerId]: {
        details: {
          label: '',
          size: HEADER_ELEMENT_SIZES.LARGE,
        },
        id: headerId,
        parentId: parentId,
        type: FORM_ELEMENT_TYPES.HEADER,
      },
    });
  });
});
