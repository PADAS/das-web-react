import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { EVENT_FORM_STATES, PREVIEW_FEATURES } from '../../../../constants';
import { isReportActive } from '../../../../utils/events';
import { usePreviewFeature } from '../../../../hooks';

import AddAttachmentButton from '../../../../AddAttachmentButton';
import AddNoteButton from '../../../../AddNoteButton';
import AddReportButton from '../../../../DetailViewComponents/AddReportButton';
import SaveSplitButton from './SaveSplitButton';

import * as styles from './styles.module.scss';

const { ACTIVE, RESOLVED, REVIEW } = EVENT_FORM_STATES;

const Footer = ({
  addReportFormProps,
  isAddedReport = false,
  isCommunity = false,
  isSaveDisabled = false,
  isSaving = false,
  onAddAttachments,
  onAddNote,
  onAddReport,
  onCancel = null,
  onSave,
  onSaveAndSetState,
  report,
  shouldShowAddReportButton = false,
}) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventOverview.footer' });

  // Remove this flag and the conditional option below once community input is
  // enabled for all tenants.
  const isCommunityInputEnabled = usePreviewFeature(PREVIEW_FEATURES.COMMUNITY_INPUT_ADMIN);

  const isActive = isReportActive(report);
  const isInReview = report?.state === REVIEW;

  const saveOptions = isCommunity ? [] : [
    (isActive || isInReview) && { key: 'resolve', label: t('saveAndResolveOption'), targetState: RESOLVED },
    isActive && isCommunityInputEnabled && { key: 'review', label: t('saveAndReviewOption'), targetState: REVIEW },
    isInReview && { key: 'activate', label: t('saveAndActivateOption'), targetState: ACTIVE },
    !isActive && !isInReview && { key: 'reopen', label: t('saveAndReopenOption'), targetState: ACTIVE },
  ]
    .filter(Boolean)
    .map((saveOption) => ({ ...saveOption, onClick: () => onSaveAndSetState(saveOption.targetState) }));

  return <footer className={styles.footer}>
    <div className={styles.leftActions} inert={isSaving}>
      <AddNoteButton
        data-testid={`reportDetailView-addNoteButton-${isAddedReport ? 'added' : 'original'}`}
        onAddNote={onAddNote}
      />

      <AddAttachmentButton onAddAttachments={onAddAttachments} />

      {shouldShowAddReportButton && <AddReportButton formProps={addReportFormProps} onAddReport={onAddReport} />}
    </div>

    <div className={styles.rightActions}>
      {!!onCancel && <button
        aria-label={t('cancelButtonLabel')}
        className={styles.cancelButton}
        disabled={isSaving}
        onClick={onCancel}
        title={t('cancelButtonLabel')}
        type="button"
        >
        {t('cancelButton')}
      </button>}

      <SaveSplitButton
        isSaveDisabled={isSaveDisabled}
        isSaving={isSaving}
        label={t('saveButton')}
        menuLabel={t('saveOptionsMenuLabel')}
        onSave={onSave}
        options={saveOptions}
      />
    </div>
  </footer>;
};

export default memo(Footer);
