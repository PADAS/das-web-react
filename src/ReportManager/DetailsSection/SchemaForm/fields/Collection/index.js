import React, { memo, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import Collapse from 'react-bootstrap/Collapse';
import { useTranslation } from 'react-i18next';

import { ReactComponent as AddButtonIcon } from '../../../../../common/images/icons/add_button.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../../../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../../../common/images/icons/arrow-up-simple.svg';

import SortableList from './SortableList';

import * as styles from './styles.module.scss';

const Collection = ({
  blurLocationMarker,
  breadcrumbs,
  details,
  error,
  focusLocationMarker,
  formElements,
  id,
  onFieldChange,
  renderField,
  value = [],
}) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.schemaForm.fields.collection' });

  const [isOpen, setIsOpen] = useState(true);
  // Items is an internal state variable to assign temporal ids to each
  // collection item and to track their modal and preview open state.
  const [items, setItems] = useState(value.map((_, index) => ({
    id: index,
    isFormModalOpen: false,
    isFormPreviewOpen: false,
    wasItemRecentlyAdded: false,
  })));

  const hasError = !!error?.message;
  const hasDescription = !!details.description && !hasError;
  const doesChildrenHaveErrors = !!error && Object.keys(error).some((errorKey) => errorKey !== 'message');
  const label = details.isRequired ? `${details.label} (${value.length}) *` : `${details.label} (${value.length})` ;

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
      id,
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

    onFieldChange(id, value.filter((_, index) => itemIndex !== index), updatedError);
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

    onFieldChange(id, arrayMove(value, originalItemIndex, newItemIndex), updatedError);
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
    onFieldChange(id, [...value, {}], updatedError);
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
  // prefix the marker id with the collection id and the item index.
  const focusLocationMarkerFromItem = (itemIndex) => (markerId) =>
    focusLocationMarker(`${id}.${itemIndex}.${markerId}`);

  return <div
      aria-errormessage={hasError ? `${id}-description` : undefined}
      aria-labelledby={`${id}-label`}
      aria-invalid={hasError}
      className={styles.collection}
      data-testid={`schema-form-collection-${id}`}
      id={id}
    >
    <div
      className={`${styles.header} ${hasError || doesChildrenHaveErrors ? styles.error : '' }`}
      data-testid={`schema-form-collection-header-${id}`}
    >
      <label className={styles.label} id={`${id}-label`}>
        {label}
      </label>

      <button
        aria-controls={`collectionList-${id}`}
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
      <div className={styles.collapse} id={`collectionList-${id}`}>
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
            setIsItemFormModalOpen={setIsItemFormModalOpen}
            setIsItemFormPreviewOpen={setIsItemFormPreviewOpen}
            renderField={renderField}
          />}

        <button
          aria-label={t('addButtonLabel', { itemName: details.itemName })}
          className={styles.addButton}
          disabled={details.maxItems === null ? false : value.length >= details.maxItems}
          onClick={onAddButtonClick}
          title={t('addButtonLabel', { itemName: details.itemName })}
          type="button"
        >
          <AddButtonIcon className={styles.icon} />

          {details.buttonText || t('defaultAddButton')}
        </button>
      </div>
    </Collapse>

    {(hasDescription || hasError) && <p
        aria-live={hasError ? 'assertive' : 'off'}
        className={`${styles.description} ${hasError ? styles.error : ''}`}
        id={`${id}-description`}
    >
      {error?.message || details.description}
    </p>}

  </div>;
};

export default memo(Collection);
