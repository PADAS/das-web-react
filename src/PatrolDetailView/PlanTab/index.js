import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import Form from 'react-bootstrap/Form';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';

import DatePicker from '../../DatePicker';
import TimeRangeInput from '../../TimeRangeInput';
import { fetchTrackedBySchema } from '../../ducks/trackedby';
import LoadingOverlay from '../../LoadingOverlay';
import ReportedBySelect from '../../ReportedBySelect';
import { trackEventFactory, PATROL_MODAL_CATEGORY } from '../../utils/analytics';
import { subjectIsARadio, radioHasRecentActivity } from '../../utils/subjects';
import { displayStartTimeForPatrol, displayEndTimeForPatrol } from '../../utils/patrols';

import styles from './styles.module.scss';

const { Control } = Form;
const patrolModalTracker = trackEventFactory(PATROL_MODAL_CATEGORY);

const PlanTab = ({ patrolForm, onPatrolChange, patrolLeaderSchema, fetchTrackedBySchema }) => {

  const [loadingTrackedBy, setLoadingTrackedBy] = useState(true);
  const [isAutoStart, setisAutoStart] = useState(false);
  const [isAutoEnd, setisAutoEnd] = useState(false);
  const patrolLeaders = patrolLeaderSchema?.trackedbySchema?.properties?.leader?.enum_ext?.map?.(({ value }) => value) ?? [];
  const displayTrackingSubject = useMemo(() => patrolForm.patrol_segments?.[0]?.leader, [patrolForm.patrol_segments]);
  const startDate = useMemo(() => displayStartTimeForPatrol(patrolForm), [patrolForm]);
  const endDate = useMemo(() => displayEndTimeForPatrol(patrolForm), [patrolForm]);

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
    patrolModalTracker.track('Set patrol objective');

    updatePatrol({ objective: value });
  }, [updatePatrol]);

  const updatePatrolTime = useCallback((dateType, value, isAuto) => {
    const segmentUpdate = { time_range: {} };
    if (isAuto) {
      segmentUpdate.time_range[`${dateType}_time`] = value;
      segmentUpdate[`scheduled_${dateType}`] = null;
    } else {
      segmentUpdate.time_range[`${dateType}_time`] = null;
      segmentUpdate[`scheduled_${dateType}`] = value;
    }
    updatePatrol({ patrol_segments: [segmentUpdate] });
  }, [updatePatrol]);

  const onStartDateChange = useCallback((value) => {
    patrolModalTracker.track('Set patrol start time');
    updatePatrolTime('start', value, isAutoStart);
  }, [isAutoStart, updatePatrolTime]);

  const onEndDateChange = useCallback((value) => {
    patrolModalTracker.track('Set patrol start time');
    updatePatrolTime('end', value, isAutoEnd);
  }, [isAutoEnd, updatePatrolTime]);

  const onStartTimeChange = useCallback((value) => {
    // startDate
    // console.log('%c handleCalendarChange', 'font-size:20px; color:yellow;', value);
  }, []);
  const onEndTimeChange = useCallback((value) => {
    // endDate
    // console.log('%c handleCalendarChange', 'font-size:20px; color:yellow;', value);
  }, []);

  return <>
    <label data-testid="reported-by-select" className={`${styles.trackedByLabel} ${loadingTrackedBy ? styles.loading : ''}`}>
      {loadingTrackedBy && <LoadingOverlay className={styles.loadingTrackedBy} message={''} />}
      Tracked By
      <ReportedBySelect className={styles.reportedBySelect} placeholder='Select Device...' value={displayTrackingSubject} onChange={onSelectTrackedSubject} options={patrolLeaders} />
    </label>

    <label data-testid="patrol-objective" className={styles.subheaderLabel}>
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
    <div className={styles.timeLocationRow}>
      <label data-testid="patrol-objective" className={styles.subheaderLabel}>
        Start Date
        <DatePicker selected={startDate ?? new Date()} onChange={onStartDateChange} dateFormat="yyyy-MM-dd" selectsStart startDate={startDate}/>
      </label>
      <label data-testid="patrol-objective" className={styles.subheaderLabel}>
        Start Time
        <TimeRangeInput dateValue={startDate ?? new Date()} onTimeChange={onStartTimeChange}/>
      </label>
    </div>
    <div className={styles.timeLocationRow}>
      <label data-testid="patrol-objective" className={styles.subheaderLabel}>
        End Date
        <DatePicker selected={endDate} onChange={onEndDateChange} dateFormat="yyyy-MM-dd" selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} />
      </label>
      <label data-testid="patrol-objective" className={styles.subheaderLabel}>
        End Time
        <TimeRangeInput dateValue={endDate} onTimeChange={onEndTimeChange} showOptionsDurationFromInitialValue={startDate?.toDateString() === endDate?.toDateString() }/>
      </label>
    </div>
  </>;
};

const mapStateToProps = ({ data: { patrolLeaderSchema } }) => ({
  patrolLeaderSchema
});

export default connect(mapStateToProps, { fetchTrackedBySchema })(PlanTab);
