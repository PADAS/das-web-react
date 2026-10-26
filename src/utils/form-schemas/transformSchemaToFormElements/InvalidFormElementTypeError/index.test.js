import InvalidFormElementTypeError from '.';

describe('Utils - form-schemas - transformSchemaToFormElements - InvalidFormElementTypeError', () => {
  it('is thrown as an error providing a message, name and the type', () => {
    let thrownError;
    const formElementId = 'field-1';
    const type = 'INVALID_TYPE';

    try {
      throw new InvalidFormElementTypeError(formElementId, type);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError.message).toBe('Form element "field-1" has an invalid type "INVALID_TYPE".');
    expect(thrownError.name).toBe('InvalidFormElementTypeError');
    expect(thrownError.type).toBe(type);
  });
});
