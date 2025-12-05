class UndefinedFormElementError extends Error {
  constructor(formElementId, parentId) {
    super(
      `Form element "${formElementId}" referenced in "${parentId}" is not defined in the UI schema.`,
    );
    this.name = 'UndefinedFormElementError';
    this.formElementId = formElementId;
    this.parentId = parentId;
  }
}

export default UndefinedFormElementError;
