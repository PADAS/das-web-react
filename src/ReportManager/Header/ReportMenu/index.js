import React, { useCallback, useContext, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';

import { MapContext } from '../../../App';
import { FEATURE_FLAG_LABELS, TAB_KEYS } from '../../../constants';
import { createEvent, addEventToIncident, fetchEvent } from '../../../ducks/events';
import { addModal, removeModal } from '../../../ducks/modals';
import { fetchPatrol } from '../../../ducks/patrols';
import { addPatrolSegmentToEvent, eventBelongsToCollection, eventBelongsToPatrol, createNewIncidentCollection } from '../../../utils/events';
import { openModalForPatrol } from '../../../utils/patrols';
import { useFeatureFlag } from '../../../hooks';
import useNavigate from '../../../hooks/useNavigate';

import AddToIncidentModal from '../../../ReportForm/AddToIncidentModal';
import AddToPatrolModal from '../../../ReportForm/AddToPatrolModal';
import KebabMenuIcon from '../../../KebabMenuIcon';
import { ReactComponent as IncidentIcon } from '../../../common/images/icons/incident.svg';
import { ReactComponent as PatrolIcon } from '../../../common/images/icons/patrol.svg';

import { TrackerContext } from '../../../utils/analytics';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;
const { ENABLE_PATROL_NEW_UI } = FEATURE_FLAG_LABELS;


const ReportMenu = ({ report, onReportChange }) => {

  const reportTracker = useContext(TrackerContext);
  const enableNewPatrolUI = useFeatureFlag(ENABLE_PATROL_NEW_UI);

  const navigate = useNavigate();
  const map = useContext(MapContext);
  const dispatch = useDispatch();

  const { is_collection } = report;
  const reportBelongsToCollection = useMemo(() => eventBelongsToCollection(report), [report]);
  const canAddToIncident = !report.is_collection && !reportBelongsToCollection;
  const reportBelongsToPatrol = useMemo(() => eventBelongsToPatrol(report), [report]);

  const onAddToNewIncident = useCallback(async () => {
    const incident = createNewIncidentCollection({ priority: report.priority });

    const { data: { data: newIncident } } = await dispatch(createEvent(incident));
    const [{ data: { data: thisReport } }] = await onReportChange();

    await dispatch(addEventToIncident(thisReport.id, newIncident.id));

    reportTracker.track('Added report to new incident');

    dispatch(fetchEvent(thisReport.id));
    dispatch(fetchEvent(newIncident.id)).then(({ data: { data } }) => {
      removeModal();
      navigate(`/${TAB_KEYS.REPORTS}/${data.id}`);
    });
  }, [report.priority, dispatch, onReportChange, navigate, reportTracker]);

  const onAddToExistingIncident = useCallback(async (incident) => {
    const [{ data: { data: thisReport } }] = await onReportChange();
    await dispatch(addEventToIncident(thisReport.id, incident.id));

    reportTracker.track('Added report to existing incident');

    dispatch(fetchEvent(thisReport.id));
    return dispatch(fetchEvent(incident.id)).then(({ data: { data } }) => {
      removeModal();
      navigate(`/${TAB_KEYS.REPORTS}/${data.id}`);
    });
  }, [dispatch, navigate, onReportChange, reportTracker]);

  const onStartAddToIncident = useCallback(() => {
    reportTracker.track('Click \'Add to Incident\'');
    dispatch(addModal({
      content: AddToIncidentModal,
      onAddToNewIncident,
      onAddToExistingIncident,
    }));
  }, [dispatch, onAddToExistingIncident, onAddToNewIncident, reportTracker]);

  const onAddToPatrol = useCallback(async (patrol) => {
    const patrolId = patrol.id;
    const patrolSegmentId = patrol?.patrol_segments?.[0]?.id;

    if (!patrolSegmentId) return;
    const [{ data: { data: thisReport } }] = await onReportChange();
    await addPatrolSegmentToEvent(patrolSegmentId, thisReport.id);

    reportTracker.track(`Added ${is_collection ? 'Incident':'Event'} to Patrol`);

    removeModal();
    if (enableNewPatrolUI) {
      return navigate(`/${TAB_KEYS.PATROLS}/${patrolId}`);
    }

    return dispatch(fetchPatrol(patrolId)).then(({ data: { data } }) => {
      openModalForPatrol(data, map);
    });
  }, [dispatch, enableNewPatrolUI, is_collection, map, navigate, onReportChange, reportTracker]);

  const onStartAddToPatrol = useCallback(() => {
    dispatch(addModal({
      content: AddToPatrolModal,
      onAddToPatrol,
    }));
    reportTracker.track('Click \'Add to Patrol\' button');
  }, [dispatch, onAddToPatrol, reportTracker]);

  if (!canAddToIncident && reportBelongsToPatrol) return null;

  return  <Dropdown align="end" className={styles.kebabMenu}>
    <Toggle as="button" className={styles.kebabToggle} data-testid="reportMenu-kebab-button">
      <KebabMenuIcon />
    </Toggle>
    <Menu className={styles.menuDropdown}>
      {canAddToIncident && <Item className={styles.itemBtn} data-testid="reportMenu-add-to-incident" variant='link' onClick={onStartAddToIncident}>
        <IncidentIcon className={styles.itemIcon} />Add to Incident
      </Item>}

      {!reportBelongsToPatrol && <Item className={styles.itemBtn} data-testid="reportMenu-add-to-patrol" variant='link' onClick={onStartAddToPatrol}>
        <PatrolIcon className={styles.itemIcon} />
        Add to Patrol
      </Item>}
    </Menu>
  </Dropdown>;
};

export default ReportMenu;

ReportMenu.propTypes = {
  report: PropTypes.object.isRequired,
  onReportChange: PropTypes.func.isRequired,
};