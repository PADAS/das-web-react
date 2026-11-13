class InvalidFormElementTypeError extends Error {
  constructor(formElementId, type) {
    super(`Form element "${formElementId}" has an invalid type "${type}".`);
    this.name = 'InvalidFormElementTypeError';
    this.formElementId = formElementId;
    this.type = type;
  }
}

export default InvalidFormElementTypeError;
