import React, { memo, useContext } from 'react';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClipIcon } from '../../../../../common/images/icons/link.svg';
import { ReactComponent as IncidentIcon } from '../../../../../common/images/icons/incident.svg';
import { ReactComponent as MarkerFeedIcon } from '../../../../../common/images/icons/marker-feed.svg';
import { ReactComponent as PatrolIcon } from '../../../../../common/images/icons/patrol.svg';
import { ReactComponent as PrinterIcon } from '../../../../../common/images/icons/printer-outline.svg';

import { addEventToIncident, createEvent, fetchEvent } from '../../../../../ducks/events';
import { addModal, removeModal } from '../../../../../ducks/modals';
import {
  addPatrolSegmentToEvent,
  createNewIncidentCollection,
  eventBelongsToCollection,
  eventBelongsToPatrol,
  getReportLink,
} from '../../../../../utils/events';
import { basePrintingStyles } from '../../../../../utils/styles';
import { governingPatrolSegment } from '../../../../../utils/patrols';
import { TAB_KEYS } from '../../../../../constants';
import { TrackerContext } from '../../../../../utils/analytics';

import AddToIncidentModal from '../../../../../AddToIncidentModal';
import AddToPatrolModal from '../../../../../AddToPatrolModal';
import KebabMenu from '../../../../../KebabMenu';

import * as styles from './styles.module.scss';

const COPY_LINK_TOAST_AUTOCLOSE = 2000;

const ReportMenu = ({
  hasLocation,
  onJumpToLocation,
  onSaveReport,
  printableContentRef,
  report,
  setRedirectTo,
  title,
}) => {
  const dispatch = useDispatch();
  const onPrint = useReactToPrint({
    contentRef: printableContentRef,
    documentTitle: `${report.serial_number ?? ''} ${title}`.trim(),
    pageStyle: basePrintingStyles,
  });
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventOverview.header.reportMenu' });

  const tracker = useContext(TrackerContext);

  const belongsToPatrol = eventBelongsToPatrol(report);
  const canAddToIncident = !report.is_collection && !eventBelongsToCollection(report);

  const onAddToIncident = async (existingIncident) => {
    const parallelOperations = [onSaveReport(undefined, false)];
    if (!existingIncident) {
      const newIncident = createNewIncidentCollection({ priority: report.priority });
      parallelOperations.push(dispatch(createEvent(newIncident)));
    }
    const [[{ data: { data: savedReport } }], createIncidentResponse] = await Promise.all(parallelOperations);

    const incident = existingIncident || createIncidentResponse.data.data;

    await dispatch(addEventToIncident(savedReport.id, incident.id));

    tracker.track(`Added report to ${existingIncident ? 'existing' : 'new'} incident`);

    dispatch(fetchEvent(savedReport.id));
    dispatch(fetchEvent(incident.id)).then(({ data: { data } }) => {
      removeModal();
      setRedirectTo(`/${TAB_KEYS.EVENTS}/${data.id}`);
    });
  };

  const onStartAddToIncident = () => {
    dispatch(addModal({
      content: AddToIncidentModal,
      onAddToNewIncident: onAddToIncident,
      onAddToExistingIncident: onAddToIncident,
    }));

    tracker.track('Click \'Add to Incident\'');
  };

  const onAddToPatrol = async (patrol) => {
    const patrolSegmentId = governingPatrolSegment(patrol)?.id;
    if (!patrolSegmentId) return;

    const [{ data: { data: savedReport } }] = await onSaveReport(undefined, false);

    await addPatrolSegmentToEvent(patrolSegmentId, savedReport.id)
      .catch((error) => console.warn('add segment error', error));

    tracker.track(`Added ${report.is_collection ? 'Incident':'Event'} to Patrol`);

    dispatch(fetchEvent(savedReport.id)).then(() => {
      removeModal();
      setRedirectTo(`/${TAB_KEYS.PATROLS}/${patrol.id}`);
    });
  };

  const onCopyLink = async () => {
    try {
      await window.navigator.clipboard.writeText(getReportLink(report));

      toast.info(t('copyLinkMessage'), {
        autoClose: COPY_LINK_TOAST_AUTOCLOSE,
        hideProgressBar: true,
      });

      tracker.track('Copy report link');
    } catch (error) {
      console.warn('Error copying report link to clipboard: ', error);
    }
  };

  const onStartAddToPatrol = () => {
    dispatch(addModal({ content: AddToPatrolModal, onAddToPatrol }));

    tracker.track('Click \'Add to Patrol\' button');
  };

  return <KebabMenu align="end" aria-label={t('moreOptionsButtonLabel')} title={t('moreOptionsButtonLabel')}>
    <KebabMenu.Option className={styles.mobileOnlyOption} disabled={!hasLocation} onClick={onJumpToLocation}>
      <MarkerFeedIcon aria-hidden="true" />

      {t('jumpToLocationOption')}
    </KebabMenu.Option>

    <KebabMenu.Divider className={styles.mobileOnlyOption} />

    {canAddToIncident && <KebabMenu.Option onClick={onStartAddToIncident}>
      <IncidentIcon aria-hidden="true" />

      {t('addToIncidentOption')}
    </KebabMenu.Option>}

    {!belongsToPatrol && <KebabMenu.Option onClick={onStartAddToPatrol}>
      <PatrolIcon aria-hidden="true" />

      {t('addToPatrolOption')}
    </KebabMenu.Option>}

    {!!report.id && <KebabMenu.Option onClick={onCopyLink}>
      <ClipIcon aria-hidden="true" />

      {t('copyLinkOption')}
    </KebabMenu.Option>}

    <KebabMenu.Option onClick={onPrint}>
      <PrinterIcon aria-hidden="true" />

      {t('printOption')}
    </KebabMenu.Option>
  </KebabMenu>;
};

export default memo(ReportMenu);
