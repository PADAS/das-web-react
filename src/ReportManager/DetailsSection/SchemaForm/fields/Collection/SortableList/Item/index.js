import React, { forwardRef, useEffect, useRef } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSimpleIcon } from '../../../../../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../../../../../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as GripDotsVerticalIcon } from '../../../../../../../common/images/icons/grip-dots-vertical.svg';
import { ReactComponent as PencilIcon } from '../../../../../../../common/images/icons/pencil.svg';
import { ReactComponent as TrashCanIcon } from '../../../../../../../common/images/icons/trash-can.svg';

import { getItemTitle } from './utils';

import FormModal from './FormModal';
import FormPreview from './FormPreview';

import styles from './styles.module.scss';

const Item = ({
  blurLocationMarker = null,
  breadcrumbs = null,
  collectionDetails,
  errors,
  fields,
  focusLocationMarker = null,
  formData,
  id,
  index = null,
  isDragging = false,
  isDragOverlay = false,
  isFormModalOpen = false,
  isItemRecentAdded = false,
  isFormPreviewOpen,
  onChange = null,
  onDelete = null,
  renderField = null,
  setIsFormModalOpen = null,
  setIsFormPreviewOpen = null,
  ...otherProps
}, ref) => {
  const { i18n, t } = useTranslation('reports', {
    keyPrefix: 'reportManager.detailsSection.schemaForm.fields.collection.sortableList.item',
  });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  // We use these variables to store the initial errors and form data so we can restore those values if the user does
  // changes and then clicks the cancel button.
  const errorsBeforeEditingRef = useRef(null);
  const formDataBeforeEditingRef = useRef(null);
  const shouldDeleteOnCancelRef = useRef(isItemRecentAdded);

  const hasError = !!errors;
  const title = getItemTitle(
    formData,
    collectionDetails.itemIdentifier,
    `${collectionDetails.itemName} ${id + 1}`,
    fields[collectionDetails.itemIdentifier],
    i18n.language,
    gpsFormat,
    t
  );

  const onTitleButtonKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();

      setIsFormPreviewOpen(!isFormPreviewOpen);
    }
  };

  const onEditButtonClick = (event) => {
    event.stopPropagation();

    setIsFormModalOpen(true);
  };

  const onFieldChange = (fieldId, value, error) => {
    // We update the field error in the errors object.
    let updatedErrors = { ...errors };
    if (error) {
      updatedErrors[fieldId] = error;
    } else {
      delete updatedErrors[fieldId];
      if (Object.keys(updatedErrors).length === 0) {
        updatedErrors = undefined;
      }
    }

    onChange({ ...formData, [fieldId]: value }, updatedErrors);
  };

  const onDeleteItem = () => {
    onDelete();
    setIsFormModalOpen(false);
  };

  const onFormModalCancel = () => {
    if (shouldDeleteOnCancelRef.current) {
      onDeleteItem();
    } else {
      onChange(formDataBeforeEditingRef.current, errorsBeforeEditingRef.current);
      setIsFormModalOpen(false);
    }
  };

  const onFormModalDone = () => {
    setIsFormModalOpen(false);
    shouldDeleteOnCancelRef.current = false;
  };

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
      return () => {
        document.body.style.cursor = '';
      };
    }
  }, [isDragging]);

  useEffect(() => {
    if (isFormModalOpen) {
      formDataBeforeEditingRef.current = structuredClone(formData);
      errorsBeforeEditingRef.current = structuredClone(errors);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormModalOpen]);

  const itemClassName = styles.item
    + (isFormPreviewOpen ? ` ${styles.open}` : '')
    + (isDragging ? ` ${styles.isDragging}` : '')
    + (isDragOverlay ? ` ${styles.dragOverlay}` : '')
    + (hasError ? ` ${styles.error}` : '');
  return <li
      className={itemClassName}
      data-testid="schema-form-collection-item"
      // We use the index and not the item id because the id is internal for having a constant default title, while the
      // index corresponds directly to the position of the item in the form data object.
      id={index !== null ? `${collectionDetails.value}.${index}` : undefined}
      ref={ref}
      {...otherProps}
    >
    <div className={styles.header}>
      <div
        aria-controls={`collectionForm-${title}`}
        aria-expanded={isFormPreviewOpen}
        // This wrapper behaves just like the chevron button so we reuse the label.
        aria-label={t(`chevronButtonLabel.${isFormPreviewOpen ? 'open' : 'closed'}`, { itemTitle: title })}
        className={styles.titleButton}
        onClick={isDragOverlay ? undefined : () => setIsFormPreviewOpen(!isFormPreviewOpen)}
        onKeyDown={onTitleButtonKeyDown}
        role="button"
        tabIndex={0}
      >
        <GripDotsVerticalIcon className={styles.dragHandle} />

        <p className={styles.title} title={title}>{title}</p>
      </div>

      <div className={styles.actionButtons}>
        <button
          aria-label={t('deleteButtonLabel', { itemTitle: title } )}
          className={styles.actionButton}
          onClick={isDragOverlay ? undefined : onDelete}
          onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && event.stopPropagation()}
          title={t('deleteButtonLabel', { itemTitle: title } )}
          type="button"
        >
          <TrashCanIcon />
        </button>

        <button
          aria-label={t('editButtonLabel', { itemTitle: title })}
          className={styles.actionButton}
          onClick={isDragOverlay ? undefined : onEditButtonClick}
          onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && event.stopPropagation()}
          title={t('editButtonLabel', { itemTitle: title })}
          type="button"
        >
          <PencilIcon />
        </button>

        <button
          aria-controls={`collectionForm-${title}`}
          aria-expanded={isFormPreviewOpen}
          aria-label={t(`chevronButtonLabel.${isFormPreviewOpen ? 'open' : 'closed'}`, { itemTitle: title })}
          className={styles.actionButton}
          onClick={isDragOverlay ? undefined : () => setIsFormPreviewOpen(!isFormPreviewOpen)}
          onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && event.stopPropagation()}
          title={t(`chevronButtonLabel.${isFormPreviewOpen ? 'open' : 'closed'}`, { itemTitle: title })}
          type="button"
        >
          {isFormPreviewOpen ? <ArrowUpSimpleIcon /> : <ArrowDownSimpleIcon />}
        </button>
      </div>
    </div>

    <Collapse in={isFormPreviewOpen}>
      <div id={`collectionForm-${title}`}>
        <FormPreview
          blurLocationMarker={blurLocationMarker}
          errors={errors}
          focusLocationMarker={focusLocationMarker}
          formData={formData}
          fieldIds={[...collectionDetails.leftColumn, ...collectionDetails.rightColumn]}
          fields={fields}
          isDragOverlay={isDragOverlay}
        />
      </div>
    </Collapse>

    {!isDragOverlay && <FormModal
      breadcrumbs={breadcrumbs}
      columns={collectionDetails.columns}
      focusLocationMarker={focusLocationMarker}
      formData={formData}
      errors={errors}
      isOpen={isFormModalOpen}
      itemName={collectionDetails.itemName}
      leftColumn={collectionDetails.leftColumn}
      onCancel={onFormModalCancel}
      onDeleteItem={onDeleteItem}
      onDone={onFormModalDone}
      onFieldChange={onFieldChange}
      isDeletable={!shouldDeleteOnCancelRef.current}
      renderField={renderField}
      rightColumn={collectionDetails.rightColumn}
      title={title}
    />}
  </li>;
};

export default forwardRef(Item);
