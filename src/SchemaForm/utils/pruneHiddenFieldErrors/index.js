import omit from 'lodash/omit';

const pruneHiddenFieldErrors = (errors, formElements, collectionItemsMessage, parentCollectionId = null) =>
  Object.keys(errors).reduce((prunedErrors, fieldName) => {
    const fieldId = parentCollectionId ? `${parentCollectionId}.${fieldName}` : fieldName;

    // Fields the form does not render cannot be fixed by the user.
    if (formElements[fieldId]) {
      const itemErrors = omit(errors[fieldName], 'message');

      if (Object.keys(itemErrors).length === 0) {
        prunedErrors[fieldName] = errors[fieldName];
      } else {
        const prunedItemErrors = Object.keys(itemErrors).reduce((accumulator, index) => {
          const prunedItem = pruneHiddenFieldErrors(itemErrors[index], formElements, collectionItemsMessage, fieldId);

          return Object.keys(prunedItem).length > 0 ? { ...accumulator, [index]: prunedItem } : accumulator;
        }, {});

        if (Object.keys(prunedItemErrors).length > 0 || errors[fieldName].message !== collectionItemsMessage) {
          prunedErrors[fieldName] = { message: errors[fieldName].message, ...prunedItemErrors };
        }
      }
    }

    return prunedErrors;
  }, {});

export default pruneHiddenFieldErrors;
