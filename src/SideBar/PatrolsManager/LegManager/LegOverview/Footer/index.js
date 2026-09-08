import React, { memo } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { useTranslation } from 'react-i18next';

import { ReactComponent as DocumentIcon } from '../../../../../common/images/icons/document.svg';

import { LEG_OVERVIEW_CATEGORY } from '../../../../../utils/analytics';
import { TAB_KEYS } from '../../../../../constants';
import { usePatrolsPermissions } from '../../../../../hooks/usePermissions';

import AddAttachmentButton from '../../../../../AddAttachmentButton';
import AddItemButton from '../../../../../AddItemButton';
import AddNoteButton from '../../../../../AddNoteButton';
import Link from '../../../../../Link';

import * as styles from './styles.module.scss';

const ADD_EVENT_ANALYTICS_METADATA = { category: LEG_OVERVIEW_CATEGORY, location: 'Leg Overview' };

const SAVE_LOADER_SIZE = 18;

const Footer = ({
  addEventFormProps,
  canEditLeg,
  disableAddNoteButton,
  disableSaveButton,
  isLegActive,
  isSaving,
  legId,
  onAddAttachments,
  onAddNote,
  onSave,
  patrolId,
}) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'legOverview.footer' });

  const { hasPatrolsUpdatePermission } = usePatrolsPermissions();

  // Notes and files land on the leg whose time range covers them, so a leg that
  // is not running has no room left for any, and the footer says as much.
  const inactiveLegProps = isLegActive ? {} : { disabled: true };

  return <footer className={`${styles.footer} ${styles.hideOnPrint}`}>
    <div className={styles.leftActions}>
      {!!hasPatrolsUpdatePermission && <AddNoteButton
        disabled={!isLegActive || disableAddNoteButton}
        onAddNote={onAddNote}
      />}

      {!!hasPatrolsUpdatePermission && <AddAttachmentButton
        onAddAttachments={onAddAttachments}
        {...inactiveLegProps}
      />}

      <AddItemButton
        analyticsMetadata={ADD_EVENT_ANALYTICS_METADATA}
        aria-label={t('addEventButtonLabel')}
        className={styles.footerActionButton}
        data-testid="legOverviewFooter-addEventButton"
        formProps={addEventFormProps}
        hideAddPatrolTab
        iconComponent={<DocumentIcon aria-hidden="true" />}
        label={t('addEventButtonText')}
        title={t('addEventButtonLabel')}
        variant="plain"
        {...inactiveLegProps}
      />
    </div>

    {!isLegActive && <p className={styles.inactiveLegHint}>{t('inactiveLegActionsHint')}</p>}

    <div className={styles.rightActions}>
      {!!hasPatrolsUpdatePermission && !!canEditLeg && <Link
        className={styles.editButton}
        to={`/${TAB_KEYS.PATROLS}/${patrolId}/legs/${legId}/edit`}
      >
        {t('editButton')}
      </Link>}

      {!!hasPatrolsUpdatePermission && <button
        aria-busy={isSaving}
        aria-label={t('saveButton')}
        className={styles.saveButton}
        disabled={disableSaveButton || isSaving}
        onClick={onSave}
        type="button"
      >
        <span className={styles.saveButtonLabel}>{t('saveButton')}</span>

        {isSaving && <span className={styles.saveButtonLoader}>
          <MoonLoader aria-hidden color="white" size={SAVE_LOADER_SIZE} />
        </span>}
      </button>}
    </div>
  </footer>;
};

export default memo(Footer);
