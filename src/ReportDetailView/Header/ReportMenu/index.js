import React, { memo, useCallback, useContext } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';

import { MapContext } from '../../../App';
import { DEVELOPMENT_FEATURE_FLAGS, TAB_KEYS } from '../../../constants';
import { createEvent, addEventToIncident, fetchEvent } from '../../../ducks/events';
import { addModal, removeModal } from '../../../ducks/modals';
import { fetchPatrol } from '../../../ducks/patrols';
import { addPatrolSegmentToEvent, eventBelongsToCollection, eventBelongsToPatrol, createNewIncidentCollection, openModalForReport } from '../../../utils/events';
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
const { ENABLE_PATROL_NEW_UI, ENABLE_REPORT_NEW_UI } = DEVELOPMENT_FEATURE_FLAGS;


const ReportMenu = ({ report, saveReport, addModal, fetchPatrol, createEvent, addEventToIncident, fetchEvent }) => {

  const navigate = useNavigate();
  const map = useContext(MapContext);

  const { is_collection } = report;
  const reportBelongsToCollection = eventBelongsToCollection(report);
  const canAddToIncident = !report.is_collection && !reportBelongsToCollection;
  const reportBelongsToPatrol = eventBelongsToPatrol(report);

  const onAddToNewIncident = useCallback(async () => {
    const incident = createNewIncidentCollection({ priority: report.priority });

    const { data: { data: newIncident } } = await createEvent(incident);
    const [{ data: { data: thisReport } }] = await saveReport();
    await addEventToIncident(thisReport.id, newIncident.id);

    reportTracker.track('Click \'Add To Incident\' button');

    return fetchEvent(newIncident.id).then(({ data: { data } }) => {
      if (ENABLE_REPORT_NEW_UI) {
        navigate(`/${TAB_KEYS.REPORTS}/${data.id}`);
      } else {
        openModalForReport(data, map);
      }
      removeModal();
    });
  }, [addEventToIncident, createEvent, fetchEvent, map, navigate, report.priority, saveReport]);

  const onAddToExistingIncident = useCallback(async (incident) => {
    const [{ data: { data: thisReport } }] = await saveReport();
    await addEventToIncident(thisReport.id, incident.id);

    reportTracker.track('Click \'Add To Incident\' button');

    return fetchEvent(incident.id).then(({ data: { data } }) => {
      if (ENABLE_REPORT_NEW_UI) {
        navigate(`/${TAB_KEYS.REPORTS}/${data.id}`);
      } else {
        openModalForReport(data, map);
      }
      removeModal();
    });
  }, [addEventToIncident, fetchEvent, map, navigate, saveReport]);

  const onStartAddToIncident = useCallback(() => {
    reportTracker.track('Click \'Add to Incident\'');
    addModal({
      content: AddToIncidentModal,
      onAddToNewIncident,
      onAddToExistingIncident,
    });
  }, [addModal, onAddToExistingIncident, onAddToNewIncident]);

  const onAddToPatrol = useCallback(async (patrol) => {
    const patrolId = patrol.id;
    const patrolSegmentId = patrol?.patrol_segments?.[0]?.id;

    if (!patrolSegmentId) return;
    const [{ data: { data: thisReport } }] = await saveReport();
    await addPatrolSegmentToEvent(patrolSegmentId, thisReport.id);

    reportTracker.track(`Add ${is_collection?'Incident':'Event'} to Patrol`);

    removeModal();
    if (ENABLE_PATROL_NEW_UI) {
      return navigate(`/${TAB_KEYS.PATROLS}/${patrolId}`);
    }

    return fetchPatrol(patrolId).then(({ data: { data } }) => {
      openModalForPatrol(data, map);
    });
  }, [fetchPatrol, is_collection, map, navigate, saveReport]);

  const onStartAddToPatrol = useCallback(() => {
    addModal({
      content: AddToPatrolModal,
      onAddToPatrol,
    });
    reportTracker.track('Click \'Add to Patrol\' button');
  }, [addModal, onAddToPatrol]);

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

export default connect(null, { addModal, fetchPatrol, createEvent, addEventToIncident, fetchEvent })(memo(ReportMenu));

ReportMenu.propTypes = {
  report: PropTypes.object.isRequired,
  saveReport: PropTypes.func.isRequired,
  addModal: PropTypes.func.isRequired,
};