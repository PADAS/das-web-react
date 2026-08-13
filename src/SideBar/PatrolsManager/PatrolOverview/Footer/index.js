import React, { memo } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import MoonLoader from 'react-spinners/MoonLoader';
import noop from 'lodash/noop';
import { useTranslation } from 'react-i18next';

import { ReactComponent as DocumentIcon } from '../../../../common/images/icons/document.svg';

import { PATROL_OVERVIEW_CATEGORY } from '../../../../utils/analytics';

import AddAttachmentButton from '../../../../AddAttachmentButton';
import AddItemButton from '../../../../AddItemButton';
import AddNoteButton from '../../../../AddNoteButton';

import * as styles from './styles.module.scss';

const ADD_EVENT_ANALYTICS_METADATA = { category: PATROL_OVERVIEW_CATEGORY, location: 'Patrol Overview' };

const SAVE_LOADER_SIZE = 18;

const Footer = ({
  addEventFormProps,
  disableAddNoteButton,
  disableSaveButton,
  isSaving,
  onAddAttachments,
  onAddNote,
  onSave,
}) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.footer' });

  return <footer className={`${styles.footer} ${styles.hideOnPrint}`}>
    <div className={styles.leftActions}>
      <AddNoteButton disabled={disableAddNoteButton} onAddNote={onAddNote} />

      <AddAttachmentButton onAddAttachments={onAddAttachments} />

      <AddItemButton
        analyticsMetadata={ADD_EVENT_ANALYTICS_METADATA}
        aria-label={t('addEventButtonLabel')}
        className={styles.footerActionButton}
        data-testid="addEventButton"
        formProps={addEventFormProps}
        hideAddPatrolTab
        iconComponent={<DocumentIcon aria-hidden="true" />}
        label={t('addEventButtonText')}
        title={t('addEventButton')}
        variant="plain"
      />
    </div>

    <div className={styles.rightActions}>
      <Dropdown>
        <Dropdown.Toggle className={styles.updateStatusButton} variant="secondary">
          {t('updateStatusButton')}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item onClick={noop}>{t('pauseOption')}</Dropdown.Item>

          <Dropdown.Item onClick={noop}>{t('cancelOption')}</Dropdown.Item>

          <Dropdown.Item onClick={noop}>{t('endOption')}</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <button
        aria-busy={isSaving}
        aria-label={isSaving ? t('saveButtonLoadingLabel') : undefined}
        className={styles.saveButton}
        disabled={disableSaveButton || isSaving}
        onClick={onSave}
        type="button"
      >
        <span className={styles.saveButtonLabel}>{t('saveButton')}</span>

        {isSaving && <span className={styles.saveButtonLoader}>
          <MoonLoader aria-hidden color="white" size={SAVE_LOADER_SIZE} />
        </span>}
      </button>
    </div>
  </footer>;
};

export default memo(Footer);
