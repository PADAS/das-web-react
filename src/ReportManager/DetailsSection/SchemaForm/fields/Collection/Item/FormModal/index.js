import React from 'react';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Modal from 'react-bootstrap/Modal';
import { useTranslation } from 'react-i18next';

import { ReactComponent as TrashCanIcon } from '../../../../../../../common/images/icons/trash-can.svg';

import styles from './styles.module.scss';

const FormModal = ({
  breadcrumbs,
  columns,
  errors,
  formData,
  isOpen,
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
    keyPrefix: 'reportManager.detailsSection.schemaForm.fields.collection.item.formModal',
  });

  return <Modal aria-labelledby="formModal-title" backdrop="static" centered keyboard={false} scrollable show={isOpen}>
    <Modal.Header className={styles.header}>
      {breadcrumbs.length > 0 && <Breadcrumb as="div" listProps={{ className: styles.list }}>
        {breadcrumbs.map((breadcrumb) => <Breadcrumb.Item
          className={styles.breadcrumb}
          linkAs="span"
          key={breadcrumb.id}
        >
          {breadcrumb.display}
        </Breadcrumb.Item>)}

        <Breadcrumb.Item className={`${styles.breadcrumb} ${styles.current}`} linkAs="span">{title}</Breadcrumb.Item>
      </Breadcrumb>}

      <Modal.Title className={styles.title} id="formModal-title">{title}</Modal.Title>
    </Modal.Header>

    <Modal.Body className={styles.body}>
      <div className={styles.columns}>
        <div className={`${styles.column} ${columns === 1 ? styles.fullWidth : styles.halfWidthLeft}`}>
          {leftColumn.map((fieldId) => renderField(
            fieldId,
            formData[fieldId],
            onFieldChange,
            errors?.[fieldId],
            [...breadcrumbs, { display: title, id: fieldId }]
          ))}
        </div>

        {columns === 2 && <div className={`${styles.column} ${styles.halfWidthRight}`}>
          {rightColumn.map((fieldId) => renderField(
            fieldId,
            formData[fieldId],
            onFieldChange,
            errors?.[fieldId],
            [...breadcrumbs, { display: title, id: fieldId }]
          ))}
        </div>}
      </div>
    </Modal.Body>

    <Modal.Footer className={styles.footer}>
      <button
        aria-label={t('deleteButton', { itemTitle: title } )}
        className={styles.deleteButton}
        onClick={onDeleteItem}
        type="button"
      >
        <TrashCanIcon />
      </button>

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
