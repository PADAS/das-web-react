import React, { useId } from 'react';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Modal from 'react-bootstrap/Modal';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as TrashCanIcon } from '../../../../../../common/images/icons/trash-can.svg';

import * as styles from './styles.module.scss';

const FormModal = ({
  breadcrumbs,
  columns,
  errors,
  focusLocationMarker,
  formData,
  formElements,
  hideDeleteButton,
  isOpen,
  itemName,
  leftColumn,
  onCancel,
  onDeleteItem,
  onDone,
  onFieldChange,
  readOnly,
  renderFormElement,
  rightColumn,
  title,
}) => {
  const { t } = useTranslation('schema-form', {
    keyPrefix: 'fields.collection.sortableList.item.formModal',
  });

  const canShowModals = useSelector((state) => state.view.modals.canShowModals);

  const titleId = useId();

  // If there are breadcrumbs, we know that we are in a nested modal (nested collection) so we disable modal animations
  // and remove the background opacity.
  const isNestedModal = breadcrumbs.length > 0;

  return <Modal
      animation={!isNestedModal}
      aria-labelledby={titleId}
      backdrop={false}
      centered
      className={`${isNestedModal ? styles.noBackground : styles.dimmedBackground} ${!canShowModals ? styles.hide : ''}`}
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

      <Modal.Title className={styles.title} id={titleId}>{itemName}</Modal.Title>
    </Modal.Header>

    <Modal.Body className={styles.body}>
      <div className={styles.columns}>
        <div
          className={`${styles.column} ${columns === 1 ? styles.fullWidth : styles.halfWidthLeft}`}
          data-testid="schema-form-collection-form-modal-left-column"
        >
          {leftColumn.map((leftColumnChildId) => {
            const leftColumnChildName = formElements[leftColumnChildId].details.value;

            return renderFormElement(
              leftColumnChildId,
              formData[leftColumnChildName],
              onFieldChange,
              errors?.[leftColumnChildName],
              focusLocationMarker,
              [...breadcrumbs, { display: title, id: leftColumnChildId }]
            );
          })}
        </div>

        {columns === 2 && <div
          className={`${styles.column} ${styles.halfWidthRight}`}
          data-testid="schema-form-collection-form-modal-right-column"
        >
          {rightColumn.map((rightColumnChildId) => {
            const rightColumnChildName = formElements[rightColumnChildId].details.value;

            return renderFormElement(
              rightColumnChildId,
              formData[rightColumnChildName],
              onFieldChange,
              errors?.[rightColumnChildName],
              focusLocationMarker,
              [...breadcrumbs, { display: title, id: rightColumnChildId }]
            );
          })}
        </div>}
      </div>
    </Modal.Body>

    <Modal.Footer className={`${styles.footer} ${hideDeleteButton ? styles.alignRight : styles.alignEvenly}`}>
      {
          !hideDeleteButton &&
          <button
              aria-label={t('deleteButton', { itemTitle: title } )}
              className={styles.deleteButton}
              disabled={readOnly}
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
