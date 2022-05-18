import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import LocationSelectorInput from '../../EditableItem/LocationSelectorInput';
// import EditableItem from '../EditableItem';

import { trackEventFactory, PATROL_MODAL_CATEGORY } from '../../utils/analytics';
import { subjectIsARadio, radioHasRecentActivity } from '../../utils/subjects';
import { displayStartTimeForPatrol, displayEndTimeForPatrol } from '../../utils/patrols';

import styles from './styles.module.scss';

const { Control } = Form;
const patrolModalTracker = trackEventFactory(PATROL_MODAL_CATEGORY);
const START_KEY = 'start';
const END_KEY = 'end';

const PlanTab = ({ patrolForm, onPatrolChange, patrolLeaderSchema, fetchTrackedBySchema }) => {

  const patrolLeaders = patrolLeaderSchema?.trackedbySchema?.properties?.leader?.enum_ext?.map?.(({ value }) => value) ?? [];
  const displayTrackingSubject = useMemo(() => patrolForm.patrol_segments?.[0]?.leader, [patrolForm.patrol_segments]);
  const startDate = useMemo(() => displayStartTimeForPatrol(patrolForm), [patrolForm]);
  const endDate = useMemo(() => displayEndTimeForPatrol(patrolForm), [patrolForm]);
  const startLocation = useMemo(() => {
    const starLocation = patrolForm.patrol_segments?.[0]?.start_location;
    return starLocation ? [starLocation.longitude, starLocation.latitude] : null;
  }, [patrolForm.patrol_segments]);
  const endLocation = useMemo(() => {
    const endLocation = patrolForm.patrol_segments?.[0]?.end_location;
    return endLocation ? [endLocation.longitude, endLocation.latitude] : null;
  }, [patrolForm.patrol_segments]);

  const [loadingTrackedBy, setLoadingTrackedBy] = useState(true);
  const [isAutoStart, setIsAutoStart] = useState(isFuture(startDate) && !patrolForm.patrol_segments[0].scheduled_start);
  const [isAutoEnd, setIsAutoEnd] = useState(isFuture(endDate) && !patrolForm.patrol_segments[0].scheduled_end);

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
    const isScheduled = !isAuto || isFuture(value);
    const segmentUpdate = {
      [`scheduled_${dateType}`]: isScheduled ? value : null,
      time_range: { [`${dateType}_time`]: !isScheduled ? value : null },
    };

    updatePatrol({ patrol_segments: [segmentUpdate] });
    patrolModalTracker.track(`Set patrol ${dateType} time`);
  }, [updatePatrol]);

  const onAutoStartChange = useCallback(() => {
    setIsAutoStart(!isAutoStart);
    updatePatrolTime('start', startDate, !isAutoStart);
  }, [isAutoStart, startDate, updatePatrolTime]);

  const onAutoEndChange = useCallback(() => {
    setIsAutoEnd(!isAutoEnd);
    updatePatrolTime('end', endDate, !isAutoEnd);
  }, [isAutoEnd, endDate, updatePatrolTime]);

  const onStartLocationChange = useCallback(() => {
    console.log('%c star location changed!', 'font-size: 28px;color:red;');
  }, []);
  const onEndLocationChange = useCallback(() => {
    console.log('%c star location changed!', 'font-size: 28px;color:red;');
  }, []);

  const StyledSubheaderLabel = ({ labelText, children,  ...rest }) => (
    <label className={styles.subheaderLabel} {...rest}>
      {labelText}
      {children}
    </label>
  );

  return <>
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
    <div className={styles.timeLocationRow}>
      <StyledSubheaderLabel labelText={'Start Date'}>
        <DatePicker
          shouldCloseOnSelect
          selected={startDate ?? new Date()}
          onChange={(value) => updatePatrolTime(START_KEY, value, isAutoStart)}
          dateFormat="dd MMM yyyy"
          selectsStart
          startDate={startDate}/>
      </StyledSubheaderLabel>
      <StyledSubheaderLabel labelText={'Start Time'}>
        <TimeRangeInput dateValue={startDate ?? new Date()} onTimeChange={(value) => updatePatrolTime(START_KEY, value, isAutoStart)}/>
      </StyledSubheaderLabel>
      <StyledSubheaderLabel labelText={'Start Location'}>
        <LocationSelectorInput label='' className={styles.locationInput} copyable={true} iconPlacement='input' location={startLocation} onLocationChange={onStartLocationChange} placeholder='Set Location'/>
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
          onChange={(value) => updatePatrolTime(END_KEY, value, isAutoEnd)}
          dateFormat="dd MMM yyyy"
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate} />
      </StyledSubheaderLabel>
      <StyledSubheaderLabel labelText={'End Time'}>
        <TimeRangeInput
          dateValue={endDate}
          starDateRange={startDate}
          onTimeChange={(value) => updatePatrolTime(END_KEY, value, isAutoEnd)}
          showOptionsDurationFromInitialValue={!endDate || startDate?.toDateString() === endDate?.toDateString()}
          />
      </StyledSubheaderLabel>
      <StyledSubheaderLabel labelText={'Start Location'}>
        <LocationSelectorInput label='' className={styles.locationInput} copyable={true} iconPlacement='input' location={endLocation} onLocationChange={onEndLocationChange} placeholder='Set Location'/>
      </StyledSubheaderLabel>
    </div>
    <label className={styles.autoFieldCheckbox}>
      <input type='checkbox' checked={isAutoEnd} onChange={onAutoEndChange} disabled={!endDate || !isFuture(endDate)} />
      <span>Automatically end the patrol at this time</span>
    </label>
  </>;
};

const mapStateToProps = ({ data: { patrolLeaderSchema } }) => ({
  patrolLeaderSchema
});

export default connect(mapStateToProps, { fetchTrackedBySchema })(PlanTab);
