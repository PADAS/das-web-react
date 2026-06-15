import UndefinedFormElementError from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - UndefinedFormElementError', () => {
  it('is thrown as an error providing a message, name, formElementId and parentId', () => {
    let thrownError;
    const formElementId = 'field-1';
    const parentId = 'section-1';

    try {
      throw new UndefinedFormElementError(formElementId, parentId);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError.message).toBe(
      'Form element "field-1" referenced in "section-1" is not defined in the schema.',
    );
    expect(thrownError.name).toBe('UndefinedFormElementError');
    expect(thrownError.formElementId).toBe(formElementId);
    expect(thrownError.parentId).toBe(parentId);
  });
});
