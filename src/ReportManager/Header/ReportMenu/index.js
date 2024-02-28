import React, { memo, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClipIcon } from '../../../common/images/icons/link.svg';
import { ReactComponent as IncidentIcon } from '../../../common/images/icons/incident.svg';
import { ReactComponent as PatrolIcon } from '../../../common/images/icons/patrol.svg';
import { ReactComponent as PrinterIcon } from '../../../common/images/icons/printer-icon.svg';

import { addEventToIncident, createEvent, fetchEvent } from '../../../ducks/events';
import { addModal, removeModal } from '../../../ducks/modals';
import {
  addPatrolSegmentToEvent,
  createNewIncidentCollection,
  eventBelongsToCollection,
  eventBelongsToPatrol,
  getReportLink,
} from '../../../utils/events';
import { basePrintingStyles } from '../../../utils/styles';
import { FEATURE_FLAG_LABELS, TAB_KEYS } from '../../../constants';
import { fetchPatrol } from '../../../ducks/patrols';
import { MapContext } from '../../../App';
import { openModalForPatrol } from '../../../utils/patrols';
import { TrackerContext } from '../../../utils/analytics';
import { useFeatureFlag } from '../../../hooks';

import AddToIncidentModal from '../../../AddToIncidentModal';
import AddToPatrolModal from '../../../AddToPatrolModal';
import TextCopyBtn from '../../../TextCopyBtn';
import OptionsMenu, { Option } from '../../../OptionsMenu';

const { ENABLE_PATROL_NEW_UI } = FEATURE_FLAG_LABELS;

const ReportMenu = ({ onSaveReport, printableContentRef, report, setRedirectTo }) => {
  const enableNewPatrolUI = useFeatureFlag(ENABLE_PATROL_NEW_UI);

  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager' });

  const map = useContext(MapContext);
  const reportTracker = useContext(TrackerContext);

  const handlePrint = useReactToPrint({
    content: () => printableContentRef.current,
    documentTitle: report.id,
    pageStyle: basePrintingStyles,
  });

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

    reportTracker.track(`Added report to ${existingIncident ? 'existing' : 'new'} incident`);

    dispatch(fetchEvent(savedReport.id));
    dispatch(fetchEvent(incident.id)).then(({ data: { data } }) => {
      removeModal();
      setRedirectTo(`/${TAB_KEYS.REPORTS}/${data.id}`);
    });
  };

  const onStartAddToIncident = () => {
    dispatch(addModal({
      content: AddToIncidentModal,
      onAddToNewIncident: onAddToIncident,
      onAddToExistingIncident: onAddToIncident,
    }));

    reportTracker.track('Click \'Add to Incident\'');
  };

  const onAddToPatrol = async (patrol) => {
    const patrolSegmentId = patrol?.patrol_segments?.[0]?.id;
    if (!patrolSegmentId) return;

    const [{ data: { data: savedReport } }] = await onSaveReport(undefined, false);
    await addPatrolSegmentToEvent(patrolSegmentId, savedReport.id);

    reportTracker.track(`Added ${report.is_collection ? 'Incident':'Event'} to Patrol`);

    dispatch(fetchEvent(savedReport.id));
    dispatch(fetchPatrol(patrol.id)).then(({ data: { data } }) => {
      removeModal();
      if (enableNewPatrolUI) {
        setRedirectTo(`/${TAB_KEYS.PATROLS}/${patrol.id}`);
      } else {
        openModalForPatrol(data, map);
      }
    });
  };

  const onStartAddToPatrol = () => {
    dispatch(addModal({ content: AddToPatrolModal, onAddToPatrol }));

    reportTracker.track('Click \'Add to Patrol\' button');
  };

  return <OptionsMenu align="end">
    {canAddToIncident && <Option as="button" onClick={onStartAddToIncident}>
      <IncidentIcon />
      {t('header.reportMenu.addToIncidentItem')}
    </Option>}

    {!belongsToPatrol && <Option as="button" onClick={onStartAddToPatrol}>
      <PatrolIcon />
      {t('header.reportMenu.addToPatrolItem')}
    </Option>}

    {!!report.id && <Option as="div">
      <TextCopyBtn
          getText={() => getReportLink(report)}
          icon={<ClipIcon />}
          label={t('header.reportMenu.textCopyButtonLabel')}
          permitPropagation
          successMessage={t('header.reportMenu.textCopyButtonSuccessMessage')}
      />
      </Option>}

    <Option as="button" onClick={handlePrint}>
      <PrinterIcon />
      {t('header.reportMenu.printReportItem')}
    </Option>
  </OptionsMenu>;
};

ReportMenu.propTypes = {
  onSaveReport: PropTypes.func.isRequired,
  printableContentRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
  report: PropTypes.shape({
    id: PropTypes.string,
    is_collection: PropTypes.bool,
    priority: PropTypes.number,
  }).isRequired,
  setRedirectTo: PropTypes.func.isRequired,
};

export default memo(ReportMenu);
