import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { connect } from 'react-redux';
import Form from 'react-bootstrap/Form';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';
import isFuture from 'date-fns/is_future';

import { BREAKPOINTS } from '../../constants';
import DatePicker from '../../DatePicker';
import TimePicker from '../../TimePicker';
import { fetchTrackedBySchema } from '../../ducks/trackedby';
import LoadingOverlay from '../../LoadingOverlay';
import ReportedBySelect from '../../ReportedBySelect';
import LocationSelectorInput from '../../EditableItem/LocationSelectorInput';

import { useMatchMedia } from '../../hooks';

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
  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  const patrolLeaders = patrolLeaderSchema?.trackedbySchema?.properties?.leader?.enum_ext?.map?.(({ value }) => value) ?? [];
  const displayTrackingSubject = useMemo(() => patrolForm.patrol_segments?.[0]?.leader, [patrolForm.patrol_segments]);
  const startDate = useMemo(() => displayStartTimeForPatrol(patrolForm), [patrolForm]);
  const endDate = useMemo(() => displayEndTimeForPatrol(patrolForm), [patrolForm]);
  const startLocation = useMemo(() => {
    const startLocation = patrolForm.patrol_segments?.[0]?.start_location;
    return startLocation ? [startLocation.longitude, startLocation.latitude] : null;
  }, [patrolForm.patrol_segments]);
  const endLocation = useMemo(() => {
    const endLocation = patrolForm.patrol_segments?.[0]?.end_location;
    return endLocation ? [endLocation.longitude, endLocation.latitude] : null;
  }, [patrolForm.patrol_segments]);

  const [loadingTrackedBy, setLoadingTrackedBy] = useState(true);
  const [isAutoStart, setIsAutoStart] = useState(isFuture(startDate) && !patrolForm.patrol_segments[0].scheduled_start);
  const [isAutoEnd, setIsAutoEnd] = useState(isFuture(endDate) && !patrolForm.patrol_segments[0].scheduled_end);

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

  const onLocationChange = useCallback((value, locationType) => {
    patrolModalTracker.track(`Set patrol ${locationType} location`);
    const locationToUpdate = {
      [`${locationType}_location`]: value ? {
        longitude: value[0],
        latitude: value[1],
      } : null,
    };

    updatePatrol({ patrol_segments: [locationToUpdate] });
  }, [updatePatrol]);

  return <div className={styles.planTab}>
    <label data-testid="reported-by-select" className={`${styles.trackedByLabel} ${loadingTrackedBy ? styles.loading : ''}`}>
      {loadingTrackedBy && <LoadingOverlay className={styles.loadingTrackedBy} message={''} />}
      Tracked By
      <ReportedBySelect className={styles.reportedBySelect} placeholder='Select Device...' value={displayTrackingSubject} onChange={onSelectTrackedSubject} options={patrolLeaders} />
    </label>
    <label className={styles.objectiveLabel} data-testid="patrol-objective">
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
    <div className={styles.timeLocationRow} ref={rowContainerRef}>
      <label className={styles.dateLabel}>
        Start Date
        <DatePicker
          className={styles.patrolDatepicker}
          maxDate={endDate}
          onChange={(value) => updatePatrolDate(START_KEY, value, isAutoStart)}
          selected={startDate ?? new Date()}
          selectsStart
          startDate={startDate}
        />
      </label>
      <label className={styles.timeLabel}>
        Start Time
        <TimePicker
          onChange={(startTime) => {
            const newStartTimeParts = startTime.split(':');
            const updatedStartDateTime = new Date(startDate);
            updatedStartDateTime.setHours(newStartTimeParts[0], newStartTimeParts[1], '00');

            updatePatrolDate(START_KEY, updatedStartDateTime, isAutoStart);
          }}
          value={getHoursAndMinutesString(startDate)}
        />
      </label>
      <label className={styles.locationLabel} data-testid="planTab-start-location">
        {isMediumLayoutOrLarger ? 'Start Location' : 'Location'}
        <LocationSelectorInput
          label=''
          className={styles.locationInput}
          copyable={isMediumLayoutOrLarger ? true : false}
          location={startLocation}
          onLocationChange={(value) => onLocationChange(value, START_KEY)}
          placeholder='Set Location'
        />
        {(!startLocation || !isMediumLayoutOrLarger) && <div className={styles.triangle}></div>}
      </label>
    </div>

    <label className={styles.autoFieldCheckbox}>
      <input type='checkbox' checked={isAutoStart} onChange={onAutoStartChange} disabled={!startDate || !isFuture(startDate)}/>
      <span>Automatically start the patrol at this time</span>
    </label>
    <div className={styles.timeLocationRow}>
      <label className={styles.dateLabel}>
        End Date
        <DatePicker
          className={styles.patrolDatepicker}
          endDate={endDate}
          minDate={startDate}
          onChange={(value) => updatePatrolDate(END_KEY, value, isAutoEnd)}
          selected={endDate}
          selectsEnd
          startDate={startDate}
        />
      </label>
      <label className={styles.timeLabel}>
        End Time
        <TimePicker
          onChange={(endTime) => {
            const newEndTimeParts = endTime.split(':');
            const updatedEndDateTime = endDate ? new Date(endDate) : new Date();
            updatedEndDateTime.setHours(newEndTimeParts[0], newEndTimeParts[1], '00');

            updatePatrolDate(END_KEY, updatedEndDateTime, isAutoEnd);
          }}
          showOptionsDurationFromInitialValue={!endDate || startDate?.toDateString() === endDate?.toDateString()}
          startTime={getHoursAndMinutesString(startDate)}
          value={getHoursAndMinutesString(endDate)}
        />
      </label>
      <label className={styles.locationLabel} data-testid="planTab-end-location">
        {isMediumLayoutOrLarger ? 'End Location' : 'Location'}
        <LocationSelectorInput
          label=''
          className={styles.locationInput}
          copyable={isMediumLayoutOrLarger ? true : false}
          location={endLocation}
          onLocationChange={(value) => onLocationChange(value, END_KEY)}
          placeholder='Set Location'
        />
        {(!endLocation || !isMediumLayoutOrLarger) && <div className={styles.triangle}></div>}
      </label>
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