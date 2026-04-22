import UndefinedFormElementError from '../../UndefinedFormElementError';

const transformCollectionField = (
  collectionFieldId,
  collectionFieldName,
  jsonSchema,
  uiSchema,
  formElements,
  transformField,
) => {
  const collectionFieldJSONSchema = jsonSchema.properties[collectionFieldName];
  // Backwards compatibility: uiSchema.fields keys used to be the field names.
  const collectionFieldUISchema =
    uiSchema.fields[collectionFieldId] ?? uiSchema.fields[collectionFieldName];

  // The JSON schema for the collection field children is the "items" subschema
  // of the collection field JSON subschema.
  const collectionFieldJSONSubschema = collectionFieldJSONSchema.items;

  // Backwards compatibility: columns used to store the children names.
  const leftColumnChildrenIds = (collectionFieldUISchema.leftColumn ?? []).map(
    (leftColumnChildId) =>
      leftColumnChildId.includes('.')
        ? leftColumnChildId
        : `${collectionFieldId}.${leftColumnChildId}`,
  );
  const rightColumnChildrenIds = (
    collectionFieldUISchema.rightColumn ?? []
  ).map((rightColumnChildId) =>
    rightColumnChildId.includes('.')
      ? rightColumnChildId
      : `${collectionFieldId}.${rightColumnChildId}`,
  );
  const collectionFieldChildrenIds = [
    ...leftColumnChildrenIds,
    ...rightColumnChildrenIds,
  ];

  collectionFieldChildrenIds.forEach((collectionFieldChildId) => {
    // Backwards compatibility: uiSchema.fields keys used to be the field
    // names.
    const collectionFieldChildName = collectionFieldChildId.split('.').pop();
    if (
      !collectionFieldJSONSubschema.properties[collectionFieldChildName] ||
      (!uiSchema.fields[collectionFieldChildId] &&
        !uiSchema.fields[collectionFieldChildName])
    ) {
      throw new UndefinedFormElementError(
        collectionFieldChildId,
        collectionFieldId,
      );
    }
  });

  const leftColumnActiveChildrenIds = leftColumnChildrenIds.filter(
    (leftColumnChildId) => {
      const leftColumnChildName = leftColumnChildId.split('.').pop();
      return !collectionFieldJSONSubschema.properties[leftColumnChildName]
        .deprecated;
    },
  );
  const rightColumnActiveChildrenIds = rightColumnChildrenIds.filter(
    (rightColumnChildId) => {
      const rightColumnChildName = rightColumnChildId.split('.').pop();
      return !collectionFieldJSONSubschema.properties[rightColumnChildName]
        .deprecated;
    },
  );

  // Backwards compatibility: itemIdentifier used to be the item identifier
  // field name.
  let itemIdentifier = collectionFieldUISchema.itemIdentifier ?? '';
  if (itemIdentifier && !itemIdentifier.includes('.')) {
    itemIdentifier = `${collectionFieldId}.${itemIdentifier}`;
  }

  // Add the collection field form element specific properties.
  formElements[collectionFieldId].details = {
    ...formElements[collectionFieldId].details,
    buttonText: collectionFieldUISchema.buttonText ?? '',
    columns: collectionFieldUISchema.columns ?? 1,
    description: collectionFieldJSONSchema.description ?? '',
    itemIdentifier,
    itemName: collectionFieldUISchema.itemName ?? '',
    leftColumn: leftColumnActiveChildrenIds,
    maxItems: collectionFieldJSONSchema.maxItems ?? null,
    minItems: collectionFieldJSONSchema.minItems ?? null,
    rightColumn: rightColumnActiveChildrenIds,
  };

  // Transform each collection field child.
  const collectionFieldActiveChildrenIds = [
    ...leftColumnActiveChildrenIds,
    ...rightColumnActiveChildrenIds,
  ];
  collectionFieldActiveChildrenIds.forEach((collectionFieldActiveChildId) => {
    const collectionFieldActiveChildName = collectionFieldActiveChildId.split('.').pop();
    transformField(
      collectionFieldActiveChildName,
      collectionFieldId,
      collectionFieldJSONSubschema,
      uiSchema,
      formElements,
    );
  });
};

export default transformCollectionField;
