import React, { memo, useCallback, useEffect, useMemo } from 'react';
import Form from 'react-bootstrap/Form';
import isEmpty from 'lodash/isEmpty';
import isFuture from 'date-fns/is_future';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as CalendarIcon } from '../../common/images/icons/calendar.svg';

import { BREAKPOINTS } from '../../constants';
import { displayEndTimeForPatrol, displayStartTimeForPatrol } from '../../utils/patrols';
import { fetchTrackedBySchema } from '../../ducks/trackedby';
import { getHoursAndMinutesString } from '../../utils/datetime';
import { updateUserPreferences } from '../../ducks/user-preferences';
import { useMatchMedia } from '../../hooks';

import DatePicker from '../../DatePicker';
import LocationSelectorInput from '../../EditableItem/LocationSelectorInput';
import ReportedBySelect from '../../ReportedBySelect';
import TimePicker from '../../TimePicker';

import styles from './styles.module.scss';

const PlanSection = ({
  onPatrolEndDateChange,
  onPatrolEndLocationChange,
  onPatrolObjectiveChange,
  onPatrolReportedByChange,
  onPatrolStartDateChange,
  onPatrolStartLocationChange,
  patrolForm,
}) => {
  const dispatch = useDispatch();

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  const isAutoEnd = useSelector((state) => state.view.userPreferences.autoEndPatrols);
  const isAutoStart = useSelector((state) => state.view.userPreferences.autoStartPatrols);
  const patrolLeaderSchema = useSelector((state) => state.data.patrolLeaderSchema);

  const endDate = displayEndTimeForPatrol(patrolForm);
  const startDate = displayStartTimeForPatrol(patrolForm);

  const startLocation = useMemo(() => {
    const startLocation = patrolForm.patrol_segments?.[0]?.start_location;

    return startLocation ? [startLocation.longitude, startLocation.latitude] : null;
  }, [patrolForm.patrol_segments]);

  const endLocation = useMemo(() => {
    const endLocation = patrolForm.patrol_segments?.[0]?.end_location;

    return endLocation ? [endLocation.longitude, endLocation.latitude] : null;
  }, [patrolForm.patrol_segments]);

  const patrolLeaders = patrolLeaderSchema?.trackedbySchema?.properties?.leader?.enum_ext
    ?.map(({ value }) => value) ?? [];

  const handleEndDateChange = useCallback((date) => {
    onPatrolEndDateChange(date, isAutoEnd);
  }, [isAutoEnd, onPatrolEndDateChange]);

  const handleStartDateChange = useCallback((date) => {
    onPatrolStartDateChange(date, isAutoStart);
  }, [isAutoStart, onPatrolStartDateChange]);

  const handleEndTimeChange = useCallback((endTime) => {
    const newEndTimeParts = endTime.split(':');
    const updatedEndDateTime = endDate ? new Date(endDate) : new Date();
    updatedEndDateTime.setHours(newEndTimeParts[0], newEndTimeParts[1], '00');

    onPatrolEndDateChange(updatedEndDateTime, isAutoEnd);
  }, [endDate, isAutoEnd, onPatrolEndDateChange]);

  const handleStartTimeChange = useCallback((startTime) => {
    const newStartTimeParts = startTime.split(':');
    const updatedStartDateTime = startDate ? new Date(startDate) : new Date();
    updatedStartDateTime.setHours(newStartTimeParts[0], newStartTimeParts[1], '00');

    onPatrolStartDateChange(updatedStartDateTime, isAutoStart);
  }, [isAutoStart, onPatrolStartDateChange, startDate]);

  const handleAutoEndChange = useCallback(() => {
    dispatch(updateUserPreferences({ autoEndPatrols: !isAutoEnd }));
    onPatrolEndDateChange(startDate, !isAutoEnd);
  }, [dispatch, isAutoEnd, onPatrolEndDateChange, startDate]);

  const handleAutoStartChange = useCallback(() => {
    dispatch(updateUserPreferences({ autoStartPatrols: !isAutoStart }));
    onPatrolStartDateChange(startDate, !isAutoStart);
  }, [dispatch, isAutoStart, onPatrolStartDateChange, startDate]);

  useEffect(() => {
    if (isEmpty(patrolLeaderSchema)) {
      dispatch(fetchTrackedBySchema());
    }
  }, [dispatch, patrolLeaderSchema]);

  return <>
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <CalendarIcon />

        <h2>Plan</h2>
      </div>
    </div>

    <div className={styles.container}>
      <div className={styles.row}>
        <label data-testid="patrolDetailView-reportedBySelect" className={styles.fieldLabel}>
          Tracked By
          <ReportedBySelect
            onChange={onPatrolReportedByChange}
            options={patrolLeaders}
            placeholder="Select Device..."
            value={patrolForm.patrol_segments?.[0]?.leader}
          />
        </label>
      </div>

      <div className={styles.row}>
        <label className={`${styles.fieldLabel} ${styles.objectiveLabel}`}>
          Objective
          <Form.Control
            as="textarea"
            data-testid="patrolDetailView-objectiveTextArea"
            onChange={onPatrolObjectiveChange}
            placeholder="Describe the purpose of the patrol..."
            rows={3}
            value={patrolForm?.objective ?? ''}
          />
        </label>
      </div>

      <div className={styles.row}>
        <div className={styles.dateTimeContainer}>
          <label
            data-testid="patrolDetailView-startDatePicker"
            className={`${styles.fieldLabel} ${styles.datePickerLabel}`}
          >
            Start Date
            <DatePicker
              className={styles.datepicker}
              maxDate={endDate}
              onChange={handleStartDateChange}
              selected={startDate ?? new Date()}
              selectsStart
              startDate={startDate}
            />
          </label>

          <label data-testid="patrolDetailView-startTimePicker" className={`${styles.fieldLabel} ${styles.timePickerLabel}`}>
            Start Time
            <TimePicker
              minutesInterval={15}
              onChange={handleStartTimeChange}
              value={getHoursAndMinutesString(startDate)}
            />
          </label>
        </div>

        <label data-testid="patrolDetailView-startLocationSelect" className={styles.fieldLabel}>
          {isMediumLayoutOrLarger ? 'Start Location' : 'Location'}
          <LocationSelectorInput
            copyable={!!isMediumLayoutOrLarger}
            label={null}
            location={startLocation}
            onLocationChange={onPatrolStartLocationChange}
            placeholder="Set Location"
          />
        </label>
      </div>

      <label className={styles.autoFieldCheckbox}>
        <input
          checked={isAutoStart}
          disabled={!startDate || !isFuture(startDate)}
          onChange={handleAutoStartChange}
          type="checkbox"
        />
        <span>Automatically start the patrol at this time</span>
      </label>

      <div className={styles.row}>
        <div className={styles.dateTimeContainer}>
          <label
            data-testid="patrolDetailView-endDatePicker"
            className={`${styles.fieldLabel} ${styles.datePickerLabel}`}
          >
            End Date
            <DatePicker
              className={styles.datepicker}
              endDate={endDate}
              minDate={startDate}
              onChange={handleEndDateChange}
              selected={endDate}
              selectsEnd
              startDate={startDate}
            />
          </label>

          <label data-testid="patrolDetailView-endTimePicker" className={`${styles.fieldLabel} ${styles.timePickerLabel}`}>
            End Time
            <TimePicker
              minutesInterval={15}
              onChange={handleEndTimeChange}
              showDurationFromStartTime={!endDate || startDate?.toDateString() === endDate?.toDateString()}
              startTime={getHoursAndMinutesString(startDate)}
              value={getHoursAndMinutesString(endDate)}
            />
          </label>
        </div>

        <label data-testid="patrolDetailView-endLocationSelect" className={styles.fieldLabel}>
          {isMediumLayoutOrLarger ? 'End Location' : 'Location'}
          <LocationSelectorInput
            copyable={!!isMediumLayoutOrLarger}
            label={null}
            location={endLocation}
            onLocationChange={onPatrolEndLocationChange}
            placeholder="Set Location"
          />
        </label>
      </div>

      <label className={styles.autoFieldCheckbox}>
        <input
          checked={isAutoEnd}
          disabled={!endDate || !isFuture(endDate)}
          onChange={handleAutoEndChange}
          type="checkbox"
        />
        <span>Automatically end the patrol at this time</span>
      </label>
    </div>
  </>;
};

PlanSection.propTypes = {
  onPatrolEndDateChange: PropTypes.func.isRequired,
  onPatrolEndLocationChange: PropTypes.func.isRequired,
  onPatrolObjectiveChange: PropTypes.func.isRequired,
  onPatrolReportedByChange: PropTypes.func.isRequired,
  onPatrolStartDateChange: PropTypes.func.isRequired,
  onPatrolStartLocationChange: PropTypes.func.isRequired,
  patrolForm: PropTypes.object.isRequired,
};

export default memo(PlanSection);
