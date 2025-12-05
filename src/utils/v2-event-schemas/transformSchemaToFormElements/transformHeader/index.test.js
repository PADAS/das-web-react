import { FORM_ELEMENT_TYPES, HEADER_ELEMENT_SIZES } from '../../constants';

import transformHeader from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformHeader', () => {
  const headerId = 'header-1';
  const parentId = 'section-1';
  let uiSchema;
  beforeEach(() => {
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
    const fields = {};
    transformHeader(headerId, uiSchema, fields);

    expect(fields).toEqual({
      [headerId]: {
        details: {
          label: 'Arrestee Details',
          size: HEADER_ELEMENT_SIZES.MEDIUM,
        },
        id: headerId,
        isNew: false,
        isSpacer: false,
        parentId: parentId,
        type: FORM_ELEMENT_TYPES.HEADER,
      },
    });
  });

  it('transforms a header with no label', () => {
    delete uiSchema.headers[headerId].label;

    const fields = {};
    transformHeader(headerId, uiSchema, fields);

    expect(fields).toEqual({
      [headerId]: {
        details: {
          label: '',
          size: HEADER_ELEMENT_SIZES.MEDIUM,
        },
        id: headerId,
        isNew: false,
        isSpacer: false,
        parentId: parentId,
        type: FORM_ELEMENT_TYPES.HEADER,
      },
    });
  });

  it('transforms a large header', () => {
    uiSchema.headers[headerId].size = HEADER_ELEMENT_SIZES.LARGE;

    const fields = {};
    transformHeader(headerId, uiSchema, fields);

    expect(fields).toEqual({
      [headerId]: {
        details: {
          label: 'Arrestee Details',
          size: HEADER_ELEMENT_SIZES.LARGE,
        },
        id: headerId,
        isNew: false,
        isSpacer: false,
        parentId: parentId,
        type: FORM_ELEMENT_TYPES.HEADER,
      },
    });
  });

  it('transforms a small header', () => {
    uiSchema.headers[headerId].size = HEADER_ELEMENT_SIZES.SMALL;

    const fields = {};
    transformHeader(headerId, uiSchema, fields);

    expect(fields).toEqual({
      [headerId]: {
        details: {
          label: 'Arrestee Details',
          size: HEADER_ELEMENT_SIZES.SMALL,
        },
        id: headerId,
        isNew: false,
        isSpacer: false,
        parentId: parentId,
        type: FORM_ELEMENT_TYPES.HEADER,
      },
    });
  });

  it('transforms a header with missing properties', () => {
    delete uiSchema.headers[headerId].label;
    delete uiSchema.headers[headerId].size;

    const fields = {};
    transformHeader(headerId, uiSchema, fields);

    expect(fields).toEqual({
      [headerId]: {
        details: {
          label: '',
          size: HEADER_ELEMENT_SIZES.LARGE,
        },
        id: headerId,
        isNew: false,
        isSpacer: false,
        parentId: parentId,
        type: FORM_ELEMENT_TYPES.HEADER,
      },
    });
  });
});
