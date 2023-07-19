import React, { memo, useCallback, useContext, useMemo } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { MapContext } from '../../../App';
import { FEATURE_FLAG_LABELS, TAB_KEYS } from '../../../constants';
import { createEvent, addEventToIncident, fetchEvent } from '../../../ducks/events';
import { addModal, removeModal } from '../../../ducks/modals';
import { fetchPatrol } from '../../../ducks/patrols';
import { addPatrolSegmentToEvent, eventBelongsToCollection, eventBelongsToPatrol, createNewIncidentCollection } from '../../../utils/events';
import { openModalForPatrol } from '../../../utils/patrols';
import { useFeatureFlag } from '../../../hooks';

import { ReactComponent as IncidentIcon } from '../../../common/images/icons/incident.svg';
import { ReactComponent as PatrolIcon } from '../../../common/images/icons/patrol.svg';

import { TrackerContext } from '../../../utils/analytics';

import AddToIncidentModal from '../../../ReportForm/AddToIncidentModal';
import AddToPatrolModal from '../../../ReportForm/AddToPatrolModal';
import KebabMenuIcon from '../../../KebabMenuIcon';

import styles from './styles.module.scss';
import TextCopyBtn from '../../../TextCopyBtn';
import { ReactComponent as ClipIcon } from '../../../common/images/icons/link.svg';

const { Toggle, Menu, Item } = Dropdown;
const { ENABLE_PATROL_NEW_UI } = FEATURE_FLAG_LABELS;

const ReportMenu = ({ onSaveReport, report, setRedirectTo }) => {
  const dispatch = useDispatch();

  const map = useContext(MapContext);
  const reportTracker = useContext(TrackerContext);

  const enableNewPatrolUI = useFeatureFlag(ENABLE_PATROL_NEW_UI);

  const { is_collection } = report;
  const reportBelongsToCollection = useMemo(() => eventBelongsToCollection(report), [report]);
  const canAddToIncident = !is_collection && !reportBelongsToCollection;
  const reportBelongsToPatrol = useMemo(() => eventBelongsToPatrol(report), [report]);

  const onAddToNewIncident = useCallback(async () => {
    const incident = createNewIncidentCollection({ priority: report.priority });

    const { data: { data: newIncident } } = await dispatch(createEvent(incident));
    const [{ data: { data: thisReport } }] = await onSaveReport(undefined, false);

    await dispatch(addEventToIncident(thisReport.id, newIncident.id));

    reportTracker.track('Added report to new incident');

    dispatch(fetchEvent(thisReport.id));
    dispatch(fetchEvent(newIncident.id)).then(({ data: { data } }) => {
      removeModal();
      setRedirectTo(`/${TAB_KEYS.REPORTS}/${data.id}`);
    });
  }, [report.priority, dispatch, onSaveReport, reportTracker, setRedirectTo]);

  const onAddToExistingIncident = useCallback(async (incident) => {
    const [{ data: { data: thisReport } }] = await onSaveReport(undefined, false);
    await dispatch(addEventToIncident(thisReport.id, incident.id));

    reportTracker.track('Added report to existing incident');

    dispatch(fetchEvent(thisReport.id));
    return dispatch(fetchEvent(incident.id)).then(({ data: { data } }) => {
      removeModal();
      setRedirectTo(`/${TAB_KEYS.REPORTS}/${data.id}`);
    });
  }, [dispatch, onSaveReport, reportTracker, setRedirectTo]);

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
    const [{ data: { data: thisReport } }] = await onSaveReport(undefined, false);
    await addPatrolSegmentToEvent(patrolSegmentId, thisReport.id);

    reportTracker.track(`Added ${is_collection ? 'Incident':'Event'} to Patrol`);

    removeModal();

    dispatch(fetchEvent(thisReport.id));
    return dispatch(fetchPatrol(patrolId)).then(({ data: { data } }) => {
      if (enableNewPatrolUI) {
        setRedirectTo(`/${TAB_KEYS.PATROLS}/${patrolId}`);
      } else {
        openModalForPatrol(data, map);
      }
    });
  }, [dispatch, enableNewPatrolUI, is_collection, map, onSaveReport, reportTracker, setRedirectTo]);

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

      { !!report.id && <Item className={styles.itemBtn}>
        <TextCopyBtn
          label='Copy report link'
          text={window.location.href}
          icon={<ClipIcon/>}
          successMessage='Link copied'
          permitPropagation
        />
      </Item>}

    </Menu>
  </Dropdown>;
};

export default memo(ReportMenu);

ReportMenu.propTypes = {
  onSaveReport: PropTypes.func.isRequired,
  report: PropTypes.object.isRequired,
  setRedirectTo: PropTypes.func.isRequired,
};
