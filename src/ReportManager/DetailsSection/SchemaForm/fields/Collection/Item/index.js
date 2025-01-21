import React, { useEffect, useRef, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PencilIcon } from '../../../../../../common/images/icons/pencil.svg';

import { getHumanizedValue } from './utils';

import FormModal from './FormModal';
import FormPreview from './FormPreview';

import styles from './styles.module.scss';

const getTitle = (formData, identifier, name, index, fields, language) => {
  const defaultTitle = `${name} - ${index + 1}`;

  if (!identifier || !formData[identifier]) {
    return defaultTitle;
  }
  return getHumanizedValue(fields[identifier], formData[identifier], defaultTitle, language);
};

const Item = ({
  breadcrumbs,
  columns,
  errors,
  fields,
  formData,
  identifier,
  index,
  leftColumn,
  name,
  onChange,
  onDelete,
  renderField,
  rightColumn,
}) => {
  const { i18n, t } = useTranslation('reports', {
    keyPrefix: 'reportManager.detailsSection.schemaForm.fields.collection.item',
  });

  // We use these variables to store the initial errors and form data so we can restore those values if the user does
  // changes and then clicks the cancel button.
  const errorsBeforeEditingRef = useRef(null);
  const formDataBeforeEditingRef = useRef(null);
  const headerRef = useRef();

  const [isOpen, setIsOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const hasError = !!errors;
  const title = getTitle(formData, identifier, name, index, fields, i18n.language);

  // Keyboard navigation for the item header.
  const onHeaderKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      setIsOpen(!isOpen);
    }
  };

  const onEditButtonClick = (event) => {
    event.stopPropagation();

    setIsFormModalOpen(true);
  };

  const onFormModalCancel = () => {
    onChange(formDataBeforeEditingRef.current, errorsBeforeEditingRef.current);
    setIsFormModalOpen(false);
  };

  const onFieldChange = (fieldId, value, error) => {
    let updatedErrors = { ...errors };
    if (error) {
      // If the changed field has an error, we set it in the updated errors object.
      updatedErrors[fieldId] = error;
    } else {
      // If the changed field cleans its error we delete its property.
      delete updatedErrors[fieldId];
      if (Object.keys(updatedErrors).length === 0) {
        // If after deleting the changed field error the error object is empty, we totally remove it.
        updatedErrors = undefined;
      }
    }

    onChange({ ...formData, [fieldId]: value }, updatedErrors);
  };

  const onDeleteItem = () => {
    onDelete();
    setIsFormModalOpen(false);
  };

  useEffect(() => {
    headerRef.current.focus();
  }, []);

  useEffect(() => {
    if (isFormModalOpen) {
      formDataBeforeEditingRef.current = structuredClone(formData);
      errorsBeforeEditingRef.current = structuredClone(errors);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormModalOpen]);

  return <li className={`${styles.item} ${isOpen ? styles.open : ''} ${hasError ? styles.error : ''}`}>
    <div
      aria-controls={`collectionForm-${title}`}
      aria-expanded={isOpen}
      aria-label={t(`headerLabel.${isOpen ? 'open' : 'closed'}`, { itemTitle: title })}
      className={styles.header}
      onClick={() => setIsOpen(!isOpen)}
      onKeyDown={onHeaderKeyDown}
      ref={headerRef}
      role="button"
      tabIndex={0}
    >
      <p className={styles.title}>{title}</p>

      <button
        aria-label={t('editButton', { itemTitle: title })}
        className={styles.editButton}
        onClick={onEditButtonClick}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && event.stopPropagation()}
        type="button"
      >
        <PencilIcon />
      </button>
    </div>

    <Collapse in={isOpen}>
      <div id={`collectionForm-${title}`}>
        <FormPreview
          errors={errors}
          formData={formData}
          fieldIds={[...leftColumn, ...rightColumn]}
          fields={fields}
        />
      </div>
    </Collapse>

    <FormModal
      breadcrumbs={breadcrumbs}
      columns={columns}
      formData={formData}
      errors={errors}
      isOpen={isFormModalOpen}
      leftColumn={leftColumn}
      onCancel={onFormModalCancel}
      onDeleteItem={onDeleteItem}
      onDone={() => setIsFormModalOpen(false)}
      onFieldChange={onFieldChange}
      renderField={renderField}
      rightColumn={rightColumn}
      title={title}
    />
  </li>;
};

export default Item;
