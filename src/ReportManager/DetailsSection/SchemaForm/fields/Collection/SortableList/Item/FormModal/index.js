import React from 'react';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Modal from 'react-bootstrap/Modal';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as TrashCanIcon } from '../../../../../../../../common/images/icons/trash-can.svg';

import styles from './styles.module.scss';

const FormModal = ({
  breadcrumbs,
  columns,
  errors,
  focusLocationMarker,
  formData,
  isOpen,
  isDeletable,
  itemName,
  leftColumn,
  onCancel,
  onDeleteItem,
  onDone,
  onFieldChange,
  renderField,
  rightColumn,
  title,
}) => {
  const { t } = useTranslation('reports', {
    keyPrefix: 'reportManager.detailsSection.schemaForm.fields.collection.sortableList.item.formModal',
  });

  const canShowModals = useSelector((state) => state.view.modals.canShowModals);

  // If there are breadcrumbs, we know that we are in a nested modal (nested collection) so we disable modal animations
  // and remove the background opacity.
  const isNestedModal = breadcrumbs.length > 0;

  return <Modal
      animation={!isNestedModal}
      aria-labelledby="formModal-title"
      backdrop={false}
      centered
      className={`${styles.formModal} ${isNestedModal ? styles.noBackground : ''} ${!canShowModals ? styles.hide : ''}`}
      // It's a good practice to add a focus trap in modals but since some widgets like selects or time pickers use
      // popovers to render their menus, they get impossible to access.
      enforceFocus={false}
      keyboard={false}
      scrollable
      show={isOpen}
    >
    <Modal.Header className={styles.header}>
      <Breadcrumb as="div" listProps={{ className: styles.list }}>
        {breadcrumbs.map((breadcrumb) => <Breadcrumb.Item
          className={styles.breadcrumb}
          key={breadcrumb.id}
          linkAs="span"
        >
          {breadcrumb.display}
        </Breadcrumb.Item>)}

        <Breadcrumb.Item className={`${styles.breadcrumb} ${styles.current}`} linkAs="span">{title}</Breadcrumb.Item>
      </Breadcrumb>

      <Modal.Title className={styles.title} id="formModal-title">{itemName}</Modal.Title>
    </Modal.Header>

    <Modal.Body className={styles.body}>
      <div className={styles.columns}>
        <div
          className={`${styles.column} ${columns === 1 ? styles.fullWidth : styles.halfWidthLeft}`}
          data-testid="schema-form-collection-form-modal-left-column"
        >
          {leftColumn.map((fieldId) => renderField(
            fieldId,
            formData[fieldId],
            onFieldChange,
            errors?.[fieldId],
            focusLocationMarker,
            [...breadcrumbs, { display: title, id: fieldId }]
          ))}
        </div>

        {columns === 2 && <div
          className={`${styles.column} ${styles.halfWidthRight}`}
          data-testid="schema-form-collection-form-modal-right-column"
        >
          {rightColumn.map((fieldId) => renderField(
            fieldId,
            formData[fieldId],
            onFieldChange,
            errors?.[fieldId],
            focusLocationMarker,
            [...breadcrumbs, { display: title, id: fieldId }]
          ))}
        </div>}
      </div>
    </Modal.Body>

    <Modal.Footer className={`${styles.footer} ${isDeletable ? styles.alignEvenly : styles.alignRight}`}>
      {
        isDeletable &&
          <button
              aria-label={t('deleteButton', { itemTitle: title } )}
              className={styles.deleteButton}
              onClick={onDeleteItem}
              title={t('deleteButton', { itemTitle: title } )}
              type="button">
            <TrashCanIcon />
          </button>
      }
      <div>
        <button className={styles.cancelButton} onClick={onCancel} type="button">
          {t('cancelButton')}
        </button>

        <button className={styles.doneButton} onClick={onDone} type="button">
          {t('doneButton')}
        </button>
      </div>
    </Modal.Footer>
  </Modal>;
};

export default FormModal;
