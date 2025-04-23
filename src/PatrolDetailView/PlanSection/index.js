import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { format, isFuture, isValid, parseISO } from 'date-fns';
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
import { getHoursAndMinutesString, getTimezoneOffsetString } from '../../utils/datetime';
import { updateUserPreferences } from '../../ducks/user-preferences';
import { setMapLocationSelectionPatrol } from '../../ducks/map-ui';
import { useMatchMedia } from '../../hooks';

import DatePicker, { EMPTY_DATE_VALUE } from '../../DatePicker';
import LocationPicker from '../../LocationPicker';
import ReportedBySelect from '../../ReportedBySelect';
import TimePicker, { isValidTime } from '../../TimePicker';

import * as styles from './styles.module.scss';
import { selectPatrolLeadersWithLastPosition } from '../../selectors/patrols';
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
  const patrolLeaders = useSelector(selectPatrolLeadersWithLastPosition);
  const displayEndDate = displayEndTimeForPatrol(patrolForm);
  const displayStartDate = displayStartTimeForPatrol(patrolForm);
  const endDayIsSameAsStart = displayEndDate && displayStartDate?.toDateString() === displayEndDate?.toDateString();
  const { t } = useTranslation('patrols', { keyPrefix: 'detailView.planSection' });

  const [endDate, setEndDate] = useState(displayEndDate ? format(displayEndDate, 'yyyy-MM-dd') : EMPTY_DATE_VALUE);
  const [endTime, setEndTime] = useState(getHoursAndMinutesString(displayEndDate));
  const [startDate, setStartDate] = useState(format(displayStartDate ?? new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(getHoursAndMinutesString(displayStartDate));

  const handleEndDateChange = useCallback((date) => {
    setEndDate(date);

    let dateISO = `${date}T`;
    dateISO += isValidTime(endTime) ? endTime : '00:00';
    dateISO += `:00${getTimezoneOffsetString()}`;

    const parsedDate = parseISO(dateISO);
    if (isValid(parsedDate)) {
      onPatrolEndDateChange(parsedDate, shouldScheduleDate(parsedDate, isAutoEnd));
    } else {
      onPatrolEndDateChange(undefined);
    }
  }, [endTime, isAutoEnd, onPatrolEndDateChange]);

  const handleStartDateChange = useCallback((date) => {
    setStartDate(date);

    let dateISO = `${date}T`;
    dateISO += isValidTime(startTime) ? startTime : '00:00';
    dateISO += `:00${getTimezoneOffsetString()}`;

    const parsedDate = parseISO(dateISO);
    if (isValid(parsedDate)) {
      onPatrolStartDateChange(parsedDate, shouldScheduleDate(parsedDate, isAutoStart));
    } else {
      onPatrolStartDateChange(undefined);
    }
  }, [isAutoStart, onPatrolStartDateChange, startTime]);

  const handleEndTimeChange = useCallback((endTime) => {
    setEndTime(endTime);

    const newEndTimeParts = endTime.split(':');
    const updatedEndDateTime = displayEndDate ? new Date(displayEndDate) : new Date();
    updatedEndDateTime.setHours(newEndTimeParts[0], newEndTimeParts[1], '00');

    onPatrolEndDateChange(updatedEndDateTime, shouldScheduleDate(updatedEndDateTime, isAutoEnd));
  }, [displayEndDate, isAutoEnd, onPatrolEndDateChange]);

  const handleStartTimeChange = useCallback((startTime) => {
    setStartTime(startTime);

    const newStartTimeParts = startTime.split(':');
    const updatedStartDateTime = displayStartDate ? new Date(displayStartDate) : new Date();
    updatedStartDateTime.setHours(newStartTimeParts[0], newStartTimeParts[1], '00');

    onPatrolStartDateChange(updatedStartDateTime, shouldScheduleDate(updatedStartDateTime, isAutoStart));
  }, [displayStartDate, isAutoStart, onPatrolStartDateChange]);

  const handleAutoEndChange = useCallback(() => {
    const newIsAutoEnd = !isAutoEnd;

    if (isNewPatrol){
      dispatch(updateUserPreferences({ autoEndPatrols: newIsAutoEnd }));
    }
    setIsAutoEnd(newIsAutoEnd);
    onPatrolEndDateChange(displayEndDate, shouldScheduleDate(displayEndDate, newIsAutoEnd));
  }, [displayEndDate, isAutoEnd, onPatrolEndDateChange, isNewPatrol, dispatch]);

  const handleAutoStartChange = useCallback(() => {
    const newIsAutoStart = !isAutoStart;

    if (isNewPatrol){
      dispatch(updateUserPreferences({ autoStartPatrols: newIsAutoStart }));
    }
    setIsAutoStart(newIsAutoStart);
    onPatrolStartDateChange(displayStartDate, shouldScheduleDate(displayStartDate, newIsAutoStart));
  }, [dispatch, displayStartDate, isAutoStart, isNewPatrol, onPatrolStartDateChange]);

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
            className={styles.fieldLabel}
          >
            {t('startDateLabel')}
            <DatePicker
              data-testid="patrolDetailView-planSection-startDatePicker"
              onChange={handleStartDateChange}
              reactDatePickerProps={{ endDate: displayEndDate, selectsStart: true, startDate: displayStartDate }}
              value={startDate}
            />
          </label>

          <label data-testid="patrolDetailView-startTimePicker" className={`${styles.fieldLabel} ${styles.timePickerLabel}`}>
            {t('startTimeLabel')}
            <TimePicker
              data-testid="patrolDetailView-planSection-startTimePicker"
              minutesInterval={15}
              onChange={handleStartTimeChange}
              value={startTime}
            />
          </label>
        </div>

        <label data-testid="patrolDetailView-startLocationSelect" className={styles.fieldLabel}>
          {t(isMediumLayoutOrLarger ? 'startLocationLargeLabel' : 'startLocationSmallLabel')}
          <LocationPicker
            id="patrolDetailView-planSection-startLocationPicker"
            onChange={onPatrolStartLocationChange}
            placeholder={t('locationSelectorPlaceholder')}
            value={patrolForm.patrol_segments?.[0]?.start_location || null}
          />
        </label>
      </div>

      <label className={styles.autoFieldCheckbox}>
        <input
          checked={isAutoStart}
          disabled={!displayStartDate || !isFuture(displayStartDate)}
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
            className={styles.fieldLabel}
          >
            {t('endDateLabel')}
            <DatePicker
              data-testid="patrolDetailView-planSection-endDatePicker"
              min={startDate}
              onChange={handleEndDateChange}
              reactDatePickerProps={{
                endDate: displayEndDate,
                selectsEnd: true,
                startDate: displayStartDate,
              }}
              value={endDate}
            />
          </label>

          <label data-testid="patrolDetailView-endTimePicker" className={`${styles.fieldLabel} ${styles.timePickerLabel}`}>
            {t('endTimeLabel')}
            <TimePicker
              data-testid="patrolDetailView-planSection-endTimePicker"
              disabled={!isValid(parseISO(endDate))}
              min={endDayIsSameAsStart ? getHoursAndMinutesString(displayStartDate) : undefined}
              minutesInterval={15}
              onChange={handleEndTimeChange}
              showDurationFromMin={endDayIsSameAsStart}
              value={endTime}
            />
          </label>
        </div>

        <label data-testid="patrolDetailView-endLocationSelect" className={styles.fieldLabel}>
          {t(isMediumLayoutOrLarger ? 'endLocationLargeLabel' : 'endLocationSmallLabel')}
          <LocationPicker
            id="patrolDetailView-planSection-endLocationPicker"
            onChange={onPatrolEndLocationChange}
            placeholder={t('locationSelectorPlaceholder')}
            value={patrolForm.patrol_segments?.[0]?.end_location || null}
          />
        </label>
      </div>

      <label className={styles.autoFieldCheckbox}>
        <input
          checked={isAutoEnd}
          disabled={endDate === EMPTY_DATE_VALUE}
          onChange={handleAutoEndChange}
          type="checkbox"
          data-testid="patrol-is-auto-end"
        />
        <span>{t(isMediumLayoutOrLarger ? 'autoEndCheckboxLargeLabel': 'autoEndCheckboxSmallLabel')}</span>
      </label>
    </div>
  </>;
};

export default memo(PlanSection);
