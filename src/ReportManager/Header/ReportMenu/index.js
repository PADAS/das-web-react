import React, { memo, useContext } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useReactToPrint } from 'react-to-print';

import { ReactComponent as ClipIcon } from '../../../common/images/icons/link.svg';
import { ReactComponent as IncidentIcon } from '../../../common/images/icons/incident.svg';
import { ReactComponent as PatrolIcon } from '../../../common/images/icons/patrol.svg';
import { ReactComponent as PrinterIcon } from '../../../common/images/icons/printer-icon.svg';

import { addModal, removeModal } from '../../../ducks/modals';
import { addPatrolSegmentToEvent, eventBelongsToCollection, eventBelongsToPatrol, createNewIncidentCollection } from '../../../utils/events';
import { createEvent, addEventToIncident, fetchEvent } from '../../../ducks/events';
import { FEATURE_FLAG_LABELS, TAB_KEYS } from '../../../constants';
import { fetchPatrol } from '../../../ducks/patrols';
import { MapContext } from '../../../App';
import { openModalForPatrol } from '../../../utils/patrols';
import { TrackerContext } from '../../../utils/analytics';
import { useFeatureFlag } from '../../../hooks';

import AddToIncidentModal from '../../../AddToIncidentModal';
import AddToPatrolModal from '../../../AddToPatrolModal';
import KebabMenuIcon from '../../../KebabMenuIcon';
import TextCopyBtn from '../../../TextCopyBtn';

import styles from './styles.module.scss';

const { ENABLE_PATROL_NEW_UI } = FEATURE_FLAG_LABELS;

const ReportMenu = ({ onSaveReport, printableContentRef, report, setRedirectTo }) => {
  const enableNewPatrolUI = useFeatureFlag(ENABLE_PATROL_NEW_UI);

  const dispatch = useDispatch();

  const map = useContext(MapContext);
  const reportTracker = useContext(TrackerContext);

  const handlePrint = useReactToPrint({
    content: () => printableContentRef.current,
    documentTitle: report.id,
    pageStyle: `
      @page {
        size: auto !important;
      }

      @media print {
        html, body {
          /* Tell browsers to print background colors */
          -webkit-print-color-adjust: exact; /* Chrome/Safari/Edge/Opera */
          color-adjust: exact; /* Firefox */

          height: initial !important;
          overflow: initial !important;
          position: initial !important;
        }
      }
    `,
  });

  const canAddToIncident = !report.is_collection && !eventBelongsToCollection(report);
  const belongsToPatrol = eventBelongsToPatrol(report);

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

  return <Dropdown align="end" className={styles.kebabMenu}>
    <Dropdown.Toggle as="button" data-testid="reportMenu-kebab-button">
      <KebabMenuIcon />
    </Dropdown.Toggle>

    <Dropdown.Menu className={styles.menuDropdown}>
      {canAddToIncident && <Dropdown.Item as="button" className={styles.itemBtn} onClick={onStartAddToIncident}>
        <IncidentIcon className={styles.itemIcon} />
        Add to Incident
      </Dropdown.Item>}

      {!belongsToPatrol && <Dropdown.Item as="button" className={styles.itemBtn} onClick={onStartAddToPatrol}>
        <PatrolIcon className={styles.itemIcon} />
        Add to Patrol
      </Dropdown.Item>}

      {!!report.id && <Dropdown.Item as="div" className={styles.itemBtn}>
        <TextCopyBtn
          label="Copy report link"
          text={window.location.href}
          icon={<ClipIcon className={styles.itemIcon} />}
          successMessage="Link copied"
          permitPropagation
        />
      </Dropdown.Item>}

      <Dropdown.Item as="button" className={styles.itemBtn} onClick={handlePrint}>
        <PrinterIcon className={styles.itemIcon} />
        Print Report
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>;
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
