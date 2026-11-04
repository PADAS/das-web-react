const pruneErrors = (errors, formElements, collectionItemsMessage, parentCollectionId = null) => {
  const pruned = {};

  Object.entries(errors).forEach(([fieldName, fieldError]) => {
    const fieldId = parentCollectionId ? `${parentCollectionId}.${fieldName}` : fieldName;
    if (!formElements[fieldId]) {
      // The form does not render this field (deprecated, in an inactive section, or undeclared), so the user cannot
      // fix it.
      return;
    }

    const { message, ...itemErrors } = fieldError;
    const itemIndexes = Object.keys(itemErrors);
    if (itemIndexes.length === 0) {
      // A plain field error, or a collection's own error (required, minItems, maxItems).
      pruned[fieldName] = fieldError;
      return;
    }

    const prunedItemErrors = {};
    itemIndexes.forEach((index) => {
      const prunedItem = pruneErrors(itemErrors[index], formElements, collectionItemsMessage, fieldId);
      if (Object.keys(prunedItem).length > 0) {
        prunedItemErrors[index] = prunedItem;
      }
    });

    if (Object.keys(prunedItemErrors).length > 0 || message !== collectionItemsMessage) {
      pruned[fieldName] = { message, ...prunedItemErrors };
    }
  });

  return pruned;
};

// Drops the validation errors for fields the form does not render, as the user cannot see or fix them.
const pruneHiddenFieldErrors = (fieldErrors, formElements, collectionItemsMessage) =>
  pruneErrors(fieldErrors, formElements, collectionItemsMessage);

export default pruneHiddenFieldErrors;
