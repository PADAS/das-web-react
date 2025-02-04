import React, { memo, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import Collapse from 'react-bootstrap/Collapse';
import { useTranslation } from 'react-i18next';

import { ReactComponent as AddButtonIcon } from '../../../../../common/images/icons/add_button.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../../../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../../../common/images/icons/arrow-up-simple.svg';

import SortableList from './SortableList';

import styles from './styles.module.scss';

// Collections have an array of objects as their value in the form data object. Each of the objects is a collection
// item and it contains the values of the fields rendered by a collection item. They can be nested within sections and
// within other collections, so we propagate values, errors and breadcrumbs and their changes to the parent and the
// children.
const Collection = ({
  breadcrumbs,
  details,
  error,
  fields,
  id,
  onFieldChange,
  renderField,
  value = [],
}) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.schemaForm.fields.collection' });

  // Ref to keep track of the temporal id of the last added item so we keep incrementing them when the user adds more
  // items.
  const lastAddedItemIdRef = useRef(value.length - 1);

  const [isOpen, setIsOpen] = useState(true);
  // Items is an internal state variable to assign temporal ids to each collection item (used as the key prop, sortable
  // id and numeric identifier) and to track their state. It's stored as an array and the index of each item in the
  // value prop will always be matched in here.
  const [items, setItems] = useState(value.map((_, index) => ({
    id: index,
    isFormModalOpen: false,
    isFormPreviewOpen: false,
  })));

  const hasError = !!error?.message;
  const doesChildrenHaveErrors = !!error && Object.keys(error).some((errorKey) => errorKey !== 'message');

  const onItemChange = (itemIndex) => (itemValue, itemError) => {
    // We clean the collection error message and update the changed item error.
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
    // We clean the error of the deleted item and the collection error message.
    let updatedError = { ...error };
    delete updatedError[itemIndex];
    delete updatedError.message;
    if (Object.keys(updatedError).length === 0) {
      updatedError = undefined;
    } else {
      // If there were errors assigned to other items, we decrease the index number of all the erroneous items over the
      // deleted item.
      Object.keys(updatedError).forEach((erroneousItemIndex) => {
        if (erroneousItemIndex > itemIndex) {
          updatedError[parseInt(erroneousItemIndex) - 1] = updatedError[erroneousItemIndex];
          delete updatedError[erroneousItemIndex];
        };
      });
    }

    onFieldChange(id, value.filter((_, index) => itemIndex !== index), updatedError);
    setItems(items.filter((_, index) => itemIndex !== index));
  };

  const onItemMove = (originalItemIndex, newItemIndex) => {
    // If there were any errors before moving the item, we update the indexes of the items after the update in the
    // error object.
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

  const setIsItemFormModalOpen = (itemIndex) => (isItemFormModalOpen) => setItems([
    ...items.slice(0, itemIndex),
    { ...items[itemIndex], isFormModalOpen: isItemFormModalOpen },
    ...items.slice(itemIndex + 1),
  ]);

  const setIsItemFormPreviewOpen = (itemIndex) => (isItemFormPreviewOpen) => setItems([
    ...items.slice(0, itemIndex),
    { ...items[itemIndex], isFormPreviewOpen: isItemFormPreviewOpen },
    ...items.slice(itemIndex + 1),
  ]);

  const onAddButtonClick = () => {
    // We clean the collection error message.
    let updatedError = { ...error };
    delete updatedError.message;
    if (Object.keys(updatedError).length === 0) {
      updatedError = undefined;
    }

    lastAddedItemIdRef.current += 1;
    onFieldChange(id, [...value, {}], updatedError);
    setItems([...items, { id: lastAddedItemIdRef.current, isFormModalOpen: true, isFormPreviewOpen: false }]);
  };

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
        {`${details.label} (${value.length})`}
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
            breadcrumbs={breadcrumbs}
            collectionDetails={details}
            fields={fields}
            // Merge the value, error and items array into a single array of item objects.
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

    {hasError && <p aria-live="assertive" className={styles.description} id={`${id}-description`}>{error.message}</p>}
  </div>;
};

export default memo(Collection);
