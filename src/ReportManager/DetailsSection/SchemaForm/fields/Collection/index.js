import React, { memo, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import { useTranslation } from 'react-i18next';

import { ReactComponent as AddButtonIcon } from '../../../../../common/images/icons/add_button.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../../../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../../../common/images/icons/arrow-up-simple.svg';

import { uuid } from '../../../../../utils/string';

import Item from './Item';

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

  const [isOpen, setIsOpen] = useState(true);
  // React requires rendered arrays to have a unique key, but there's nothing we can use for the collection items so we
  // handle an array of temporal identifiers with uuids for each item.
  const [temporalIdentifiers, setTemporalIdentifiers] = useState(value.map(() => uuid()));

  const hasError = !!error;

  // Keyboard navigation for the collection header.
  const onHeaderKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      setIsOpen(!isOpen);
    }
  };

  const onItemChange = (itemIndex) => (itemValue, itemError) => {
    let updatedError = { ...error };
    if (itemError) {
      // If the changed item has an error, we set it in the updated error object by the item index.
      updatedError[itemIndex] = itemError;
    } else {
      // If the changed item cleans its error we delete its property.
      delete updatedError[itemIndex];
      if (Object.keys(updatedError).length === 0) {
        // If after deleting the changed item error the error object is empty, we totally remove it.
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
    // We clean the error related to the deleted item and the collection error message since it is related to the
    // amount of items (min and max).
    let updatedError = { ...error };
    delete updatedError[itemIndex];
    delete updatedError.message;
    if (Object.keys(updatedError).length === 0) {
      // If after deleting the deleted item error the error object is empty, we totally remove it.
      updatedError = undefined;
    } else {
      // If there were other errors, we decrease the index number of all the erroneous items over the deleted item.
      Object.keys(updatedError).forEach((erroneousItemIndex) => {
        if (erroneousItemIndex > itemIndex) {
          updatedError[parseInt(erroneousItemIndex) - 1] = updatedError[erroneousItemIndex];
          delete updatedError[erroneousItemIndex];
        };
      });
    }

    onFieldChange(id, value.filter((_, valueIndex) => itemIndex !== valueIndex), updatedError);
    setTemporalIdentifiers(temporalIdentifiers.filter((_, idIndex) => itemIndex !== idIndex));
  };

  const onAddButtonClick = () => {
    // We clean the collection error message since it is related to the amount of items (min and max).
    let updatedError = { ...error };
    delete updatedError.message;
    if (Object.keys(updatedError).length === 0) {
      // If after deleting the collection error message the error object is empty, we totally remove it.
      updatedError = undefined;
    }

    onFieldChange(id, [...value, {}], updatedError);
    setTemporalIdentifiers([...temporalIdentifiers, uuid()]);
  };

  return (
    <div className={styles.collection} data-testid={`schema-form-collection-${id}`} id={id}>
      <div
        aria-controls={`collectionList-${id}`}
        aria-expanded={isOpen}
        aria-label={t(`headerLabel.${isOpen ? 'open' : 'closed'}`, { collectionLabel: details.label })}
        className={`${styles.header} ${hasError ? styles.error : '' }`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={onHeaderKeyDown}
        role="button"
        tabIndex={0}
      >
        {isOpen
          ? <ArrowUpSimpleIcon className={styles.chevron} />
          : <ArrowDownSimpleIcon className={styles.chevron} />}

        <label className={styles.label} htmlFor={id}>
          {details.label} - {value.length}
        </label>
      </div>

      <Collapse in={isOpen}>
        <div id={`collectionList-${id}`} className={styles.collapse}>
          {value.length === 0
            ? <div className={styles.emptyState} />
            : <ul aria-live="polite">
              {value.map((itemValues, index) => <Item
                breadcrumbs={breadcrumbs}
                columns={details.columns}
                errors={error?.[index]}
                fields={fields}
                formData={itemValues}
                identifier={details.itemIdentifier}
                index={index}
                key={temporalIdentifiers[index]}
                leftColumn={details.leftColumn}
                name={details.itemName}
                onChange={onItemChange(index)}
                onDelete={onItemDelete(index)}
                renderField={renderField}
                rightColumn={details.rightColumn}
              />)}
            </ul>}

          <button
            aria-label={t('addButtonLabel', { itemName: details.itemName })}
            className={styles.addButton}
            disabled={details.maxItems === null ? false : value.length >= details.maxItems}
            onClick={onAddButtonClick}
            type="button"
          >
            <AddButtonIcon className={styles.icon} />

            {details.buttonText || t('defaultAddButton')}
          </button>
        </div>
      </Collapse>

      {error?.message && <p aria-live="assertive" className={styles.description}>{error.message}</p>}
    </div>
  );
};

export default memo(Collection);
