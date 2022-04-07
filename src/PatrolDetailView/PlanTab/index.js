import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import Form from 'react-bootstrap/Form';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';

import DatePicker from '../../DatePicker';
import { fetchTrackedBySchema } from '../../ducks/trackedby';
import LoadingOverlay from '../../LoadingOverlay';
import ReportedBySelect from '../../ReportedBySelect';
import { trackEventFactory, PATROL_MODAL_CATEGORY } from '../../utils/analytics';
import { subjectIsARadio, radioHasRecentActivity } from '../../utils/subjects';

import styles from './styles.module.scss';

const { Control } = Form;
const patrolModalTracker = trackEventFactory(PATROL_MODAL_CATEGORY);
// const CALENDAR_CONFIG = {
//   clearIcon: null,
//   calendarIcon: null,
//   format: 'yyyy-MM-dd HH:mm',
//   minDate: new Date(2011, 1, 1),
// };

// const preventEventBubbling = (_value, event) => {
//   event.preventDefault();
//   event.stopPropagation();
// };

// const BLOCKED_EVENT_HANDLERS = { /* bugfix for odd react-calendar behavior in which clicks bubble up to every subsequent button control. issue to be filed w/react-calendar in github. */
//   onClickMonth: preventEventBubbling,
//   onClickYear: preventEventBubbling,
//   onClickDecade: preventEventBubbling,
// };


const PlanTab = ({ patrolForm, onPatrolChange, patrolLeaderSchema, fetchTrackedBySchema }) => {

  const [loadingTrackedBy, setLoadingTrackedBy] = useState(true);
  const patrolLeaders = patrolLeaderSchema?.trackedbySchema?.properties?.leader?.enum_ext?.map?.(({ value }) => value) ?? [];
  const displayTrackingSubject = useMemo(() => patrolForm.patrol_segments?.[0]?.leader, [patrolForm.patrol_segments]);
  const startDate = useMemo(() => patrolForm.patrol_segments?.[0]?.time_range?.start_time, [patrolForm.patrol_segments]);

  useEffect(() => {
    if (isEmpty(patrolLeaderSchema)){
      fetchTrackedBySchema()
        .finally(() => setLoadingTrackedBy(false));
    } else {
      setLoadingTrackedBy(false);
    }
  }, [fetchTrackedBySchema, patrolLeaderSchema]);


  const updatePatrol = useCallback((update) => {
    onPatrolChange(merge({}, patrolForm, update));
  }, [onPatrolChange, patrolForm]);
  const onSelectTrackedSubject = useCallback((value) => {
    const patrolIsNew = !patrolForm.id;

    patrolModalTracker.track(`${value ? 'Set' : 'Unset'} patrol tracked subject`);

    const update = {
      patrol_segments: [
        {
          leader: value || null,
        },
      ],
    };

    if (patrolIsNew) {
      const trackedSubjectLocation = value?.last_position?.geometry?.coordinates;
      const trackedSubjectLocationTime = value?.last_position?.properties?.coordinateProperties?.time;

      if (radioHasRecentActivity(value)
        && subjectIsARadio(value)
        && !!trackedSubjectLocation
        && !!trackedSubjectLocationTime) {

        update.patrol_segments[0].start_location = {
          latitude: trackedSubjectLocation[1],
          longitude: trackedSubjectLocation[0],
        };

        update.patrol_segments[0].time_range = {
          start_time: trackedSubjectLocationTime,
        };
      } else if (!value) {
        update.patrol_segments[0].start_location = null;
        update.patrol_segments[0].time_range = {
          start_time: new Date().toISOString(),
        };
      }
    }

    updatePatrol(update);
  }, [patrolForm.id, updatePatrol]);

  const onObjectiveChange = useCallback((event) => {
    event.preventDefault();
    const { value } = event.target;

    updatePatrol({ objective: value });
  }, [updatePatrol]);

  const handleCalendarChange = useCallback((value) => {
    console.log('%c handleCalendarChange', 'font-size:20px; color:yellow;', value);
    // updatePatrol(value);
  }, []);

  return <>
    <label data-testid="reported-by-select" className={`${styles.trackedByLabel} ${loadingTrackedBy ? styles.loading : ''}`}>
      {loadingTrackedBy && <LoadingOverlay className={styles.loadingTrackedBy} message={''} />}
      Tracked By
      <ReportedBySelect className={styles.reportedBySelect} placeholder='Select Device...' value={displayTrackingSubject} onChange={onSelectTrackedSubject} options={patrolLeaders} />
    </label>

    <label data-testid="patrol-objective" className={styles.objectiveLabel}>
      Objective
      <Control
        as="textarea"
        data-testid="patrol-objective-input"
        placeholder="Describe the purpose of the patrol..."
        rows={3}
        value={patrolForm?.objective ?? ''}
        onChange={onObjectiveChange}
      />
    </label>

    <h3>Start</h3>
    <label data-testid="patrol-objective" className={styles.objectiveLabel}>
      Start Date
      {/* <Calendar {...CALENDAR_CONFIG} {...BLOCKED_EVENT_HANDLERS} onChange={handleCalendarChange} value={new Date(startDate) ?? new Date.now()} /> */}
      <DatePicker value={startDate ?? new Date()} onChange={handleCalendarChange}/>
    </label>
  </>;
};

const mapStateToProps = ({ data: { patrolLeaderSchema } }) => ({
  patrolLeaderSchema
});

export default connect(mapStateToProps, { fetchTrackedBySchema })(PlanTab);
