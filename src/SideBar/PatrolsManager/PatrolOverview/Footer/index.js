import React, { memo, useState } from 'react';
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

const Footer = ({ addEventFormProps, disableAddNoteButton, onAddAttachments, onAddNote }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.footer' });

  // TODO: Implement saving logic.
  const [isSaving] = useState(false);

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
        disabled={isSaving}
        onClick={noop}
        type="button"
      >
        {isSaving
          ? <MoonLoader aria-hidden color="white" size={SAVE_LOADER_SIZE} />
          : t('saveButton')}
      </button>
    </div>
  </footer>;
};

export default memo(Footer);
