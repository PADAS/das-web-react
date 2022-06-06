import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { connect } from 'react-redux';
import Form from 'react-bootstrap/Form';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';
import isFuture from 'date-fns/is_future';

import DatePicker from '../../DatePicker';
import TimeRangeInput from '../../TimeRangeInput';
import { fetchTrackedBySchema } from '../../ducks/trackedby';
import LoadingOverlay from '../../LoadingOverlay';
import ReportedBySelect from '../../ReportedBySelect';
import { trackEventFactory, PATROL_MODAL_CATEGORY } from '../../utils/analytics';
import { subjectIsARadio, radioHasRecentActivity } from '../../utils/subjects';
import { displayStartTimeForPatrol, displayEndTimeForPatrol } from '../../utils/patrols';
import { getHoursAndMinutesString } from '../../utils/datetime';

import styles from './styles.module.scss';

const { Control } = Form;
const patrolModalTracker = trackEventFactory(PATROL_MODAL_CATEGORY);
const START_KEY = 'start';
const END_KEY = 'end';

const PlanTab = ({ patrolForm, onPatrolChange, patrolLeaderSchema, fetchTrackedBySchema }) => {

  const [loadingTrackedBy, setLoadingTrackedBy] = useState(true);
  const patrolLeaders = patrolLeaderSchema?.trackedbySchema?.properties?.leader?.enum_ext?.map?.(({ value }) => value) ?? [];
  const displayTrackingSubject = useMemo(() => patrolForm.patrol_segments?.[0]?.leader, [patrolForm.patrol_segments]);
  const startDate = useMemo(() => displayStartTimeForPatrol(patrolForm), [patrolForm]);
  const endDate = useMemo(() => displayEndTimeForPatrol(patrolForm), [patrolForm]);
  const [isAutoStart, setIsAutoStart] = useState(isFuture(startDate) && !patrolForm.patrol_segments[0].scheduled_start);
  const [isAutoEnd, setIsAutoEnd] = useState(isFuture(endDate) && !patrolForm.patrol_segments[0].scheduled_end);
  const [startTime, setStartTime] = useState(getHoursAndMinutesString(startDate));
  const [endTime, setEndTime] = useState(getHoursAndMinutesString(endDate));

  const rowContainerRef = useRef(null);

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

  const updatePatrolDate = useCallback((dateType, value, isAuto) => {
    const isScheduled = !isAuto && isFuture(value);
    const segmentUpdate = {
      [`scheduled_${dateType}`]: isScheduled ? value : null,
      time_range: { [`${dateType}_time`]: !isScheduled ? value : null },
    };

    updatePatrol({ patrol_segments: [segmentUpdate] });
    patrolModalTracker.track(`Set patrol ${dateType} time`);
  }, [updatePatrol]);

  const onAutoStartChange = useCallback(() => {
    setIsAutoStart(!isAutoStart);
    updatePatrolDate('start', startDate, !isAutoStart);
  }, [isAutoStart, startDate, updatePatrolDate]);

  const onAutoEndChange = useCallback(() => {
    setIsAutoEnd(!isAutoEnd);
    updatePatrolDate('end', endDate, !isAutoEnd);
  }, [isAutoEnd, endDate, updatePatrolDate]);

  const StyledSubheaderLabel = ({ labelText, children,  ...rest }) => (
    <label className={styles.subheaderLabel} {...rest}>
      {labelText}
      {children}
    </label>
  );

  return <div className={styles.planTab}>
    <label data-testid="reported-by-select" className={`${styles.trackedByLabel} ${loadingTrackedBy ? styles.loading : ''}`}>
      {loadingTrackedBy && <LoadingOverlay className={styles.loadingTrackedBy} message={''} />}
      Tracked By
      <ReportedBySelect className={styles.reportedBySelect} placeholder='Select Device...' value={displayTrackingSubject} onChange={onSelectTrackedSubject} options={patrolLeaders} />
    </label>
    <StyledSubheaderLabel labelText={'Objective'} data-testid="patrol-objective">
      <Control
        as="textarea"
        data-testid="patrol-objective-input"
        placeholder="Describe the purpose of the patrol..."
        rows={3}
        value={patrolForm?.objective ?? ''}
        onChange={onObjectiveChange}
      />
    </StyledSubheaderLabel>
    <div className={styles.timeLocationRow} ref={rowContainerRef}>
      <StyledSubheaderLabel labelText={'Start Date'}>
        <DatePicker
          shouldCloseOnSelect
          selected={startDate ?? new Date()}
          onChange={(value) => updatePatrolDate(START_KEY, value, isAutoStart)}
          dateFormat="dd MMM yyyy"
          selectsStart
          startDate={startDate}
          maxDate={endDate}
          />
      </StyledSubheaderLabel>
      <StyledSubheaderLabel labelText={'Start Time'}>
        <TimeRangeInput containerRef={rowContainerRef} timeValue={startTime} dateValue={startDate ?? new Date()} onTimeChange={(value) => {updatePatrolDate(START_KEY, value, isAutoStart); setStartTime(getHoursAndMinutesString(value));}}/>
      </StyledSubheaderLabel>
    </div>
    <label className={styles.autoFieldCheckbox}>
      <input type='checkbox' checked={isAutoStart} onChange={onAutoStartChange} disabled={!startDate || !isFuture(startDate)}/>
      <span>Automatically start the patrol at this time</span>
    </label>
    <div className={styles.timeLocationRow}>
      <StyledSubheaderLabel labelText={'End Date'}>
        <DatePicker
          shouldCloseOnSelect
          selected={endDate}
          onChange={(value) => updatePatrolDate(END_KEY, value, isAutoEnd)}
          dateFormat="dd MMM yyyy"
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate} />
      </StyledSubheaderLabel>
      <StyledSubheaderLabel labelText={'End Time'}>
        <TimeRangeInput
          timeValue={endTime}
          dateValue={endDate}
          starDateRange={startDate}
          onTimeChange={(value) => {updatePatrolDate(END_KEY, value, isAutoEnd); setEndTime(getHoursAndMinutesString(value));}}
          showOptionsDurationFromInitialValue={!endDate || startDate?.toDateString() === endDate?.toDateString()}
          />
      </StyledSubheaderLabel>
    </div>
    <label className={styles.autoFieldCheckbox}>
      <input type='checkbox' checked={isAutoEnd} onChange={onAutoEndChange} disabled={!endDate || !isFuture(endDate)} />
      <span>Automatically end the patrol at this time</span>
    </label>
  </div>;
};

const mapStateToProps = ({ data: { patrolLeaderSchema } }) => ({
  patrolLeaderSchema
});

export default connect(mapStateToProps, { fetchTrackedBySchema })(PlanTab);
