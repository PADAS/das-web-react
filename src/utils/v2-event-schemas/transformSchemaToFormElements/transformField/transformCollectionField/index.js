import UndefinedFormElementError from '../../UndefinedFormElementError';

const transformCollectionField = (
  collectionFieldId,
  jsonSchema,
  uiSchema,
  formElements,
  transformField,
) => {
  const collectionFieldJSONSchema = jsonSchema.properties[collectionFieldId];
  const collectionFieldUISchema = uiSchema.fields[collectionFieldId];

  // Filter out inactive children from the collection field's columns.
  const leftColumn = (collectionFieldUISchema.leftColumn ?? []).filter(
    (collectionFieldChildId) => !collectionFieldJSONSchema.items.properties[collectionFieldChildId].deprecated
  );
  const rightColumn = (collectionFieldUISchema.rightColumn ?? []).filter(
    (collectionFieldChildId) => !collectionFieldJSONSchema.items.properties[collectionFieldChildId].deprecated
  );

  // Add the collection field specific properties to its node in the form
  // elements object.
  formElements[collectionFieldId].details = {
    ...formElements[collectionFieldId].details,
    buttonText: collectionFieldUISchema.buttonText ?? '',
    columns: collectionFieldUISchema.columns ?? 1,
    description: collectionFieldJSONSchema.description ?? '',
    itemIdentifier: collectionFieldUISchema.itemIdentifier ?? '',
    itemName: collectionFieldUISchema.itemName ?? '',
    leftColumn,
    maxItems: collectionFieldJSONSchema.maxItems ?? null,
    minItems: collectionFieldJSONSchema.minItems ?? null,
    rightColumn,
  };

  // Transform each collection field child.
  const collectionFieldChildrenIds = [...leftColumn, ...rightColumn];
  collectionFieldChildrenIds.forEach((collectionFieldChildId) => {
    if (uiSchema.fields[collectionFieldChildId]) {
      transformField(
        collectionFieldChildId,
        collectionFieldJSONSchema.items,
        uiSchema,
        formElements,
      );
    } else {
      throw new UndefinedFormElementError(collectionFieldChildId, collectionFieldId);
    }
  });
};

export default transformCollectionField;
