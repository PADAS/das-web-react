import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { isFuture } from 'date-fns';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as CalendarIcon } from '../../common/images/icons/calendar.svg';

import { BREAKPOINTS } from '../../constants';
import {
  actualEndTimeForPatrol,
  actualStartTimeForPatrol,
  displayEndTimeForPatrol,
  displayStartTimeForPatrol
} from '../../utils/patrols';
import { fetchTrackedBySchema } from '../../ducks/trackedby';
import { getHoursAndMinutesString } from '../../utils/datetime';
import { updateUserPreferences } from '../../ducks/user-preferences';
import { setMapLocationSelectionPatrol } from '../../ducks/map-ui';
import { useMatchMedia } from '../../hooks';

import DatePicker from '../../DatePicker';
import LocationSelectorInput from '../../EditableItem/LocationSelectorInput';
import ReportedBySelect from '../../ReportedBySelect';
import TimePicker from '../../TimePicker';

import styles from './styles.module.scss';
import { getPatrolLeadersWithLocation } from '../../selectors/patrols';
import { useTranslation } from 'react-i18next';

const shouldScheduleDate = (date, isAuto) => !isAuto && isFuture(date);

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
  const isNewPatrol = !patrolForm.id;
  const actualStartTime = useMemo(() => actualStartTimeForPatrol(patrolForm), [patrolForm]);
  const actualEndTime = useMemo(() => actualEndTimeForPatrol(patrolForm), [patrolForm]);
  const userPrefAutoEnd = useSelector((state) => state.view.userPreferences.autoEndPatrols);
  const userPrefAutoStart = useSelector((state) => state.view.userPreferences.autoStartPatrols);
  const [isAutoEnd, setIsAutoEnd] = useState(isNewPatrol ? userPrefAutoEnd : !!actualEndTime);
  const [isAutoStart, setIsAutoStart] = useState(isNewPatrol ? userPrefAutoStart : !!actualStartTime);
  const patrolLeaders = useSelector(getPatrolLeadersWithLocation);
  const endDate = displayEndTimeForPatrol(patrolForm);
  const startDate = displayStartTimeForPatrol(patrolForm);
  const endDayIsSameAsStart = endDate && startDate?.toDateString() === endDate?.toDateString();
  const { t } = useTranslation('patrols', { keyPrefix: 'detailView.planSection' });

  const startLocation = useMemo(() => {
    const startLocation = patrolForm.patrol_segments?.[0]?.start_location;

    return startLocation ? [startLocation.longitude, startLocation.latitude] : null;
  }, [patrolForm.patrol_segments]);

  const endLocation = useMemo(() => {
    const endLocation = patrolForm.patrol_segments?.[0]?.end_location;

    return endLocation ? [endLocation.longitude, endLocation.latitude] : null;
  }, [patrolForm.patrol_segments]);

  const handleEndDateChange = useCallback((date) => {
    onPatrolEndDateChange(date, shouldScheduleDate(date, isAutoEnd));
  }, [isAutoEnd, onPatrolEndDateChange]);

  const handleStartDateChange = useCallback((date) => {
    onPatrolStartDateChange(date, shouldScheduleDate(date, isAutoStart));
  }, [isAutoStart, onPatrolStartDateChange]);

  const handleEndTimeChange = useCallback((endTime) => {
    const newEndTimeParts = endTime.split(':');
    const updatedEndDateTime = endDate ? new Date(endDate) : new Date();
    updatedEndDateTime.setHours(newEndTimeParts[0], newEndTimeParts[1], '00');

    onPatrolEndDateChange(updatedEndDateTime, shouldScheduleDate(updatedEndDateTime, isAutoEnd));
  }, [endDate, isAutoEnd, onPatrolEndDateChange]);

  const handleStartTimeChange = useCallback((startTime) => {
    const newStartTimeParts = startTime.split(':');
    const updatedStartDateTime = startDate ? new Date(startDate) : new Date();
    updatedStartDateTime.setHours(newStartTimeParts[0], newStartTimeParts[1], '00');

    onPatrolStartDateChange(updatedStartDateTime, shouldScheduleDate(updatedStartDateTime, isAutoStart));
  }, [isAutoStart, onPatrolStartDateChange, startDate]);

  const handleAutoEndChange = useCallback(() => {
    const newIsAutoEnd = !isAutoEnd;

    if (isNewPatrol){
      dispatch(updateUserPreferences({ autoEndPatrols: newIsAutoEnd }));
    }
    setIsAutoEnd(newIsAutoEnd);
    onPatrolEndDateChange(endDate, shouldScheduleDate(endDate, newIsAutoEnd));
  }, [isAutoEnd, onPatrolEndDateChange, endDate, isNewPatrol, dispatch]);

  const handleAutoStartChange = useCallback(() => {
    const newIsAutoStart = !isAutoStart;

    if (isNewPatrol){
      dispatch(updateUserPreferences({ autoStartPatrols: newIsAutoStart }));
    }
    setIsAutoStart(newIsAutoStart);
    onPatrolStartDateChange(startDate, shouldScheduleDate(startDate, newIsAutoStart));
  }, [dispatch, isAutoStart, isNewPatrol, onPatrolStartDateChange, startDate]);

  useEffect(() => {
    if (!patrolLeaders) {
      dispatch(fetchTrackedBySchema());
    }
  }, [dispatch, patrolLeaders]);

  useEffect(() => {
    dispatch(setMapLocationSelectionPatrol(patrolForm));

    return () => {
      dispatch(setMapLocationSelectionPatrol(null));
    };
  }, [dispatch, patrolForm]);

  return <>
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <CalendarIcon />
        <h2>{t('title')}</h2>
      </div>
    </div>

    <div className={styles.container}>
      <div className={styles.row}>
        <label data-testid="patrolDetailView-reportedBySelect" className={styles.fieldLabel}>
          {t('trackedByLabel')}
          <ReportedBySelect
            onChange={onPatrolReportedByChange}
            options={patrolLeaders ?? []}
            placeholder={t('trackedByPlaceholder')}
            value={patrolForm.patrol_segments?.[0]?.leader}
          />
        </label>
      </div>

      <div className={styles.row}>
        <label className={`${styles.fieldLabel} ${styles.objectiveLabel}`}>
          {t('objectiveLabel')}
          <Form.Control
            className={styles.objective}
            as="textarea"
            data-testid="patrolDetailView-objectiveTextArea"
            onChange={onPatrolObjectiveChange}
            placeholder={t('objectivePlaceholder')}
            rows={3}
            value={patrolForm?.objective ?? ''}
          />
          <div className={styles.printableObjectiveText}>
            {patrolForm?.objective ?? ''}
          </div>
        </label>
      </div>

      <div className={styles.row}>
        <div className={styles.dateTimeContainer}>
          <label
            data-testid="patrolDetailView-startDatePicker"
            className={`${styles.fieldLabel} ${styles.datePickerLabel}`}
          >
            {t('startDateLabel')}
            <DatePicker
              onChange={handleStartDateChange}
              selected={startDate ?? new Date()}
              selectsStart
              startDate={startDate}
            />
          </label>

          <label data-testid="patrolDetailView-startTimePicker" className={`${styles.fieldLabel} ${styles.timePickerLabel}`}>
            {t('startTimeLabel')}
            <TimePicker
              minutesInterval={15}
              onChange={handleStartTimeChange}
              value={getHoursAndMinutesString(startDate)}
            />
          </label>
        </div>

        <label data-testid="patrolDetailView-startLocationSelect" className={styles.fieldLabel}>
          {t(isMediumLayoutOrLarger ? 'startLocationLargeLabel' : 'startLocationSmallLabel')}
          <LocationSelectorInput
            label={null}
            location={startLocation}
            onLocationChange={onPatrolStartLocationChange}
            placeholder={t('locationSelectorPlaceholder')}
          />
        </label>
      </div>

      <label className={styles.autoFieldCheckbox}>
        <input
          checked={isAutoStart}
          disabled={!startDate || !isFuture(startDate)}
          onChange={handleAutoStartChange}
          type="checkbox"
          data-testid="patrol-is-auto-start"
        />
        <span>{t(isMediumLayoutOrLarger ? 'autoStartCheckboxLargeLabel': 'autoStartCheckboxSmallLabel' )}</span>
      </label>

      <div className={styles.row}>
        <div className={styles.dateTimeContainer}>
          <label
            data-testid="patrolDetailView-endDatePicker"
            className={`${styles.fieldLabel} ${styles.datePickerLabel}`}
          >
            {t('endDateLabel')}
            <DatePicker
              endDate={endDate}
              minDate={startDate}
              onChange={handleEndDateChange}
              selected={endDate}
              selectsEnd
              startDate={startDate}
            />
          </label>

          <label data-testid="patrolDetailView-endTimePicker" className={`${styles.fieldLabel} ${styles.timePickerLabel}`}>
            {t('endTimeLabel')}
            <TimePicker
              disabled={!endDate}
              minTime={endDayIsSameAsStart ? getHoursAndMinutesString(startDate) : null}
              minutesInterval={15}
              onChange={handleEndTimeChange}
              showDurationFromMinTime={endDayIsSameAsStart}
              value={getHoursAndMinutesString(endDate)}
            />
          </label>
        </div>

        <label data-testid="patrolDetailView-endLocationSelect" className={styles.fieldLabel}>
          {t(isMediumLayoutOrLarger ? 'endLocationLargeLabel' : 'endLocationSmallLabel')}
          <LocationSelectorInput
            label={null}
            location={endLocation}
            onLocationChange={onPatrolEndLocationChange}
            placeholder={t('locationSelectorPlaceholder')}
          />
        </label>
      </div>

      <label className={styles.autoFieldCheckbox}>
        <input
          checked={isAutoEnd}
          disabled={!endDate || !isFuture(endDate)}
          onChange={handleAutoEndChange}
          type="checkbox"
          data-testid="patrol-is-auto-end"
        />
        <span>{t(isMediumLayoutOrLarger ? 'autoEndCheckboxLargeLabel': 'autoEndCheckboxSmallLabel')}</span>
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
