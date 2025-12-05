import { FORM_ELEMENT_TYPES } from '../../../constants';
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

  // Add the collection field node to the form elements object.
  formElements[collectionFieldId] = {
    details: {
      buttonText: collectionFieldUISchema.buttonText ?? '',
      columns: collectionFieldUISchema.columns ?? 1,
      conditionalDependents: collectionFieldUISchema.conditionalDependents ?? [],
      description: collectionFieldJSONSchema.description ?? '',
      isActive: !collectionFieldJSONSchema.deprecated,
      itemIdentifier: collectionFieldUISchema.itemIdentifier ?? '',
      itemName: collectionFieldUISchema.itemName ?? '',
      label: collectionFieldJSONSchema.title ?? '',
      leftColumn: collectionFieldUISchema.leftColumn ?? [],
      maxItems: collectionFieldJSONSchema.maxItems ?? '',
      minItems: collectionFieldJSONSchema.minItems ?? '',
      rightColumn: collectionFieldUISchema.rightColumn ?? [],
      value: collectionFieldId,
    },
    id: collectionFieldId,
    isNew: false,
    isSpacer: false,
    parentId: collectionFieldUISchema.parent,
    type: FORM_ELEMENT_TYPES.COLLECTION,
  };

  // Transform each collection child.
  const collectionChildrenIds = [
    ...formElements[collectionFieldId].details.leftColumn,
    ...formElements[collectionFieldId].details.rightColumn,
  ];
  collectionChildrenIds.forEach((collectionChildId) => {
    if (uiSchema.fields[collectionChildId]) {
      transformField(
        collectionChildId,
        collectionFieldJSONSchema.items,
        uiSchema,
        formElements,
      );
    } else {
      throw new UndefinedFormElementError(collectionChildId, collectionFieldId);
    }
  });
};

export default transformCollectionField;
