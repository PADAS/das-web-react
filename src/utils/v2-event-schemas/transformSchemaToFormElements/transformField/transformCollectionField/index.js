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

  // Transform the collection field's columns with only the active children.
  const leftColumn = (collectionFieldUISchema.leftColumn ?? []).filter(
    (collectionFieldChildId) => !collectionFieldJSONSchema.items.properties[collectionFieldChildId].deprecated
  );
  const rightColumn = (collectionFieldUISchema.rightColumn ?? []).filter(
    (collectionFieldChildId) => !collectionFieldJSONSchema.items.properties[collectionFieldChildId].deprecated
  );

  // Get the collection field children IDs.
  const collectionFieldChildrenIds = [...leftColumn, ...rightColumn];

  // Throw an error if a collection field child is missing from uiSchema.fields.
  collectionFieldChildrenIds.forEach((collectionFieldChildId) => {
    if (!uiSchema.fields[collectionFieldChildId]) {
      throw new UndefinedFormElementError(
        collectionFieldChildId,
        collectionFieldId,
      );
    }
  });

  // Add the collection field form element specific properties.
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

  // The JSON schema for the collection field children is the "items" subschema
  // of the collection field JSON subschema.
  const collectionFieldJSONSubschema = collectionFieldJSONSchema.items;

  // Transform each collection field child.
  collectionFieldChildrenIds.forEach((collectionFieldChildId) =>
    transformField(
      collectionFieldChildId,
      collectionFieldJSONSubschema,
      uiSchema,
      formElements,
    ),
  );
};

export default transformCollectionField;
