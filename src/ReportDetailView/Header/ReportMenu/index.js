import React, { memo, useCallback, useContext, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';

import { MapContext } from '../../../App';
import { DEVELOPMENT_FEATURE_FLAGS, TAB_KEYS } from '../../../constants';
import { createEvent, addEventToIncident, fetchEvent } from '../../../ducks/events';
import { addModal, removeModal } from '../../../ducks/modals';
import { fetchPatrol } from '../../../ducks/patrols';
import { addPatrolSegmentToEvent, eventBelongsToCollection, eventBelongsToPatrol, createNewIncidentCollection } from '../../../utils/events';
import { openModalForPatrol } from '../../../utils/patrols';
import useNavigate from '../../../hooks/useNavigate';

import AddToIncidentModal from '../../../ReportForm/AddToIncidentModal';
import AddToPatrolModal from '../../../ReportForm/AddToPatrolModal';
import KebabMenuIcon from '../../../KebabMenuIcon';
import { ReactComponent as IncidentIcon } from '../../../common/images/icons/incident.svg';
import { ReactComponent as PatrolIcon } from '../../../common/images/icons/patrol.svg';

import { trackEventFactory, REPORT_DETAIL_VIEW_CATEGORY } from '../../../utils/analytics';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;
const reportTracker = trackEventFactory(REPORT_DETAIL_VIEW_CATEGORY);
const { ENABLE_PATROL_NEW_UI } = DEVELOPMENT_FEATURE_FLAGS;


const ReportMenu = ({ report, onReportChange }) => {

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

    reportTracker.track('Click \'Add To Incident\' button');

    dispatch(fetchEvent(newIncident.id)).then(({ data: { data } }) => {
      removeModal();
      navigate(`/${TAB_KEYS.REPORTS}/${data.id}`);
    });
  }, [report.priority, dispatch, onReportChange, navigate]);

  const onAddToExistingIncident = useCallback(async (incident) => {
    const [{ data: { data: thisReport } }] = await onReportChange();
    await dispatch(addEventToIncident(thisReport.id, incident.id));

    reportTracker.track('Click \'Add To Incident\' button');

    return dispatch(fetchEvent(incident.id)).then(({ data: { data } }) => {
      removeModal();
      navigate(`/${TAB_KEYS.REPORTS}/${data.id}`);
    });
  }, [dispatch, navigate, onReportChange]);

  const onStartAddToIncident = useCallback(() => {
    reportTracker.track('Click \'Add to Incident\'');
    dispatch(addModal({
      content: AddToIncidentModal,
      onAddToNewIncident,
      onAddToExistingIncident,
    }));
  }, [dispatch, onAddToExistingIncident, onAddToNewIncident]);

  const onAddToPatrol = useCallback(async (patrol) => {
    const patrolId = patrol.id;
    const patrolSegmentId = patrol?.patrol_segments?.[0]?.id;

    if (!patrolSegmentId) return;
    const [{ data: { data: thisReport } }] = await onReportChange();
    await addPatrolSegmentToEvent(patrolSegmentId, thisReport.id);

    reportTracker.track(`Add ${is_collection?'Incident':'Event'} to Patrol`);

    removeModal();
    if (ENABLE_PATROL_NEW_UI) {
      return navigate(`/${TAB_KEYS.PATROLS}/${patrolId}`);
    }

    return dispatch(fetchPatrol(patrolId)).then(({ data: { data } }) => {
      openModalForPatrol(data, map);
    });
  }, [dispatch, is_collection, map, navigate, onReportChange]);

  const onStartAddToPatrol = useCallback(() => {
    dispatch(addModal({
      content: AddToPatrolModal,
      onAddToPatrol,
    }));
    reportTracker.track('Click \'Add to Patrol\' button');
  }, [dispatch, onAddToPatrol]);

  if (!canAddToIncident && reportBelongsToPatrol) return null;

  return  <Dropdown alignRight className={styles.kebabMenu}>
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