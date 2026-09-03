import React, { memo, useState } from 'react';
import { arrayMove } from '@dnd-kit/helpers';
import Collapse from 'react-bootstrap/Collapse';
import { useTranslation } from 'react-i18next';

import { ReactComponent as AddButtonIcon } from '../../../common/images/icons/add_button.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../common/images/icons/arrow-up-simple.svg';

import useFormElementDomId from '../../utils/useFormElementDomId';

import SortableList from './SortableList';

import * as styles from './styles.module.scss';

const Collection = ({
  blurLocationMarker,
  breadcrumbs,
  details,
  error,
  focusLocationMarker,
  formElementId,
  formElements,
  onFieldChange,
  readOnly,
  renderFormElement,
  value = [],
}) => {
  const { t } = useTranslation('schema-form', { keyPrefix: 'fields.collection' });

  const domId = useFormElementDomId(formElementId);

  const [isOpen, setIsOpen] = useState(true);
  // Items is an internal state variable to assign temporal ids to each
  // collection item and to track their modal and preview open state.
  const [items, setItems] = useState(value.map((_, index) => ({
    id: index,
    isFormModalOpen: false,
    isFormPreviewOpen: false,
    wasItemRecentlyAdded: false,
  })));

  const doesChildrenHaveErrors = !!error && Object.keys(error).some((errorKey) => errorKey !== 'message');
  const hasError = !!error?.message;
  const isMaxItemsReached = details.maxItems === null ? false : value.length >= details.maxItems;

  const onItemChange = (itemIndex) => (itemValue, itemError) => {
    // Clean the collection error message and update the changed item error.
    let updatedError = { ...error };
    delete updatedError.message;
    if (itemError) {
      updatedError[itemIndex] = itemError;
    } else {
      delete updatedError[itemIndex];
      if (Object.keys(updatedError).length === 0) {
        updatedError = undefined;
      }
    }

    onFieldChange(
      formElementId,
      [...value.slice(0, itemIndex), itemValue, ...value.slice(itemIndex + 1)],
      updatedError
    );
  };

  const onItemDelete = (itemIndex) => () => {
    // Clean the error of the deleted item and the collection error message.
    let updatedError = { ...error };
    delete updatedError[itemIndex];
    delete updatedError.message;
    if (Object.keys(updatedError).length === 0) {
      updatedError = undefined;
    } else {
      // If there were errors assigned to other items, decrease the index
      // number of all the erroneous items over the deleted item.
      Object.keys(updatedError).forEach((erroneousItemIndex) => {
        if (erroneousItemIndex > itemIndex) {
          updatedError[parseInt(erroneousItemIndex) - 1] = updatedError[erroneousItemIndex];
          delete updatedError[erroneousItemIndex];
        }
      });
    }

    onFieldChange(formElementId, value.filter((_, index) => itemIndex !== index), updatedError);
    setItems(items.filter((_, index) => itemIndex !== index));
  };

  const onItemMove = (originalItemIndex, newItemIndex) => {
    // If there were any errors before moving the item, update the indexes of
    // the items after the update in the error object.
    let updatedError;
    if (error) {
      updatedError = error.message ? { message: error.message } : {};

      const itemErrorsAsArray = value.map((_, index) => error[index]);
      const itemErrorsAsArrayMoved = arrayMove(itemErrorsAsArray, originalItemIndex, newItemIndex);
      itemErrorsAsArrayMoved.forEach((itemError, index) => {
        if (itemError) {
          updatedError[index] = itemError;
        }
      });
    }

    onFieldChange(formElementId, arrayMove(value, originalItemIndex, newItemIndex), updatedError);
    setItems(arrayMove(items, originalItemIndex, newItemIndex));
  };

  const setIsItemFormModalOpen = (itemIndex) => (isItemFormModalOpen) => {
    setItems((currentItems) => {
      const itemToUpdate = currentItems[itemIndex];
      return !itemToUpdate
        ? currentItems
        : [
          ...currentItems.slice(0, itemIndex),
          { ...itemToUpdate, isFormModalOpen: isItemFormModalOpen, wasItemRecentlyAdded: false },
          ...currentItems.slice(itemIndex + 1)
        ];
    });
  };

  const setIsItemFormPreviewOpen = (itemIndex) => (isItemFormPreviewOpen) => setItems([
    ...items.slice(0, itemIndex),
    { ...items[itemIndex], isFormPreviewOpen: isItemFormPreviewOpen },
    ...items.slice(itemIndex + 1),
  ]);

  const onAddButtonClick = () => {
    // Clean the collection error message.
    let updatedError = { ...error };
    delete updatedError.message;
    if (Object.keys(updatedError).length === 0) {
      updatedError = undefined;
    }

    const highestExistingItemId = items.reduce((highestItemId, item) => Math.max(highestItemId, item.id), -1);
    onFieldChange(formElementId, [...value, {}], updatedError);
    setItems([
      ...items,
      {
        id: highestExistingItemId + 1,
        isFormModalOpen: true,
        isFormPreviewOpen: false,
        wasItemRecentlyAdded: true,
      }
    ]);
  };

  // If a location field from an item requests to focus its location marker,
  // prefix the marker formElementId with the collection formElementId and the item index.
  const focusLocationMarkerFromItem = (itemIndex) => (locationFieldName) =>
    focusLocationMarker(`${details.value}[${itemIndex}].${locationFieldName}`);

  return <div
      aria-errormessage={hasError ? `${domId}-description` : undefined}
      aria-labelledby={`${domId}-label`}
      aria-invalid={hasError ? 'true' : 'false'}
      className={styles.collection}
      data-testid={`schema-form-collection-${formElementId}`}
      id={domId}
    >
    <div
      className={`${styles.header} ${hasError || doesChildrenHaveErrors ? styles.error : '' }`}
      data-testid={`schema-form-collection-header-${formElementId}`}
    >
      <label className={styles.label} id={`${domId}-label`}>
        {`${details.label} (${value.length})`}

        {details.isRequired && <span aria-hidden="true"> *</span>}
      </label>

      <button
        aria-controls={`collectionList-${domId}`}
        aria-expanded={isOpen}
        aria-label={t(`chevronButtonLabel.${isOpen ? 'open' : 'closed'}`, { collectionLabel: details.label })}
        className={styles.chevronButton}
        onClick={() => setIsOpen(!isOpen)}
        title={t(`chevronButtonLabel.${isOpen ? 'open' : 'closed'}`, { collectionLabel: details.label })}
        type="button"
      >
        {isOpen ? <ArrowUpSimpleIcon /> : <ArrowDownSimpleIcon />}
      </button>
    </div>

    <Collapse in={isOpen}>
      <div className={styles.collapse} id={`collectionList-${domId}`}>
        {value.length === 0
          ? <div className={styles.emptyState} data-testid="schema-form-collection-list-empty-state" />
          : <SortableList
            blurLocationMarker={blurLocationMarker}
            breadcrumbs={breadcrumbs}
            collectionDetails={details}
            focusLocationMarker={focusLocationMarkerFromItem}
            formElements={formElements}
            // Merge the value, error and items array into a single array of
            // item objects.
            items={items
              .filter((_, index) => !!value[index])
              .map((item, index) => ({ ...item, error: error?.[index], formData: value[index] }))}
            onItemChange={onItemChange}
            onItemDelete={onItemDelete}
            onItemMove={onItemMove}
            readOnly={readOnly}
            renderFormElement={renderFormElement}
            setIsItemFormModalOpen={setIsItemFormModalOpen}
            setIsItemFormPreviewOpen={setIsItemFormPreviewOpen}
          />}

        <button
          aria-label={t('addButtonLabel', { itemName: details.itemName })}
          className={styles.addButton}
          disabled={readOnly || isMaxItemsReached}
          onClick={onAddButtonClick}
          title={t('addButtonLabel', { itemName: details.itemName })}
          type="button"
        >
          <AddButtonIcon className={styles.icon} />

          {details.buttonText || t('defaultAddButton')}
        </button>
      </div>
    </Collapse>

    <p
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${domId}-description`}
    >
      {error?.message || details.description}
    </p>
  </div>;
};

export default memo(Collection);
