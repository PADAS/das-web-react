import React, { useId, useImperativeHandle, useRef } from 'react';
import { format, isFuture } from 'date-fns';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcUrlForImage } from '../../../../utils/img';
import { getHoursAndMinutesString } from '../../../../utils/datetime';
import parseLegDraftDateTime from '../utils/parseLegDraftDateTime';

import DatePicker, { isValidDate } from '../../../../DatePicker';
import LocationPicker from '../../../../LocationPicker';
import Select from '../../../../Select';
import SvgIcon from '../../../../SvgIcon';
import TimePicker, { isValidTime } from '../../../../TimePicker';

import * as styles from './styles.module.scss';

const TIME_OPTIONS_INTERVAL_IN_MINUTES = 15;

const getOptionLabel = ({ name }) => name;
const getOptionValue = ({ id }) => id;
const getTeamOptionLabel = ({ display }) => display;

const renderSubjectOptionIcon = ({ image_url }) => !!image_url
  && <SvgIcon imageUrl={calcUrlForImage(image_url)} type="subjects" />;

const StaticFields = ({ earliestStartDateTime = null, errors, leg, onChangeLeg, ref }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'legForm.staticFields' });

  const teamAndTrackingOptions = useSelector((state) => state.data.patrolTeamAndTrackingOptions);

  const endDatePickerRef = useRef();
  const startDatePickerRef = useRef();

  useImperativeHandle(ref, () => ({
    focusField: (field) => {
      const datePickerRef = field === 'endDate' ? endDatePickerRef : startDatePickerRef;

      // Each picker is a group of inputs, the first one begins the date.
      datePickerRef.current?.querySelector('input')?.focus();
    },
  }));

  const assetsSelectId = useId();
  const autoEndCheckboxId = useId();
  const autoStartCheckboxId = useId();
  const endDateErrorId = useId();
  const endLocationId = useId();
  const endTimeLabelId = useId();
  const startDateErrorId = useId();
  const startLocationId = useId();
  const startTimeLabelId = useId();
  const teamLeadSelectId = useId();
  const teamMembersSelectId = useId();
  const teamSelectId = useId();

  const endDateTime = parseLegDraftDateTime(leg.endDate, leg.endTime);
  const startDateTime = parseLegDraftDateTime(leg.startDate, leg.startTime);

  // An empty start date would reach the picker's calendar as an invalid bound.
  const endDateMin = isValidDate(leg.startDate) ? leg.startDate : undefined;

  // The end time is bounded by the start only on the same day, and only once
  // the start time is complete: a partial one discards every option.
  const endTimeMin = isValidDate(leg.endDate) && leg.endDate === leg.startDate && isValidTime(leg.startTime)
    ? leg.startTime
    : undefined;

  const startDateMin = earliestStartDateTime ? format(earliestStartDateTime, 'yyyy-MM-dd') : undefined;

  const startTimeMin = startDateMin === leg.startDate
    ? getHoursAndMinutesString(earliestStartDateTime)
    : undefined;

  const renderCheckbox = ({ id, isChecked, isDisabled, label, onChange }) => <div className={styles.checkboxWrapper}>
    <input
      checked={isChecked}
      className={styles.checkbox}
      disabled={isDisabled}
      id={id}
      onChange={(event) => onChange(event.target.checked)}
      type="checkbox"
    />

    <label className={`${styles.checkboxLabel} ${isDisabled ? styles.disabled : ''}`} htmlFor={id}>{label}</label>
  </div>;

  const renderSelect = ({ id, label, ...selectProps }) => <div className={styles.field}>
    <label className={styles.label} htmlFor={id}>{label}</label>

    <Select
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      inputId={id}
      {...selectProps}
    />
  </div>;

  return <div className={styles.staticFields}>
    <div className={styles.columns}>
      <div className={styles.column}>
        <div aria-labelledby={startTimeLabelId} className={styles.field} role="group">
          <span className={styles.label} id={startTimeLabelId}>{t('startTimeLabel')}</span>

          <div className={styles.dateTimeInputs}>
            <DatePicker
              aria-errormessage={errors.startDate ? startDateErrorId : undefined}
              aria-invalid={errors.startDate ? 'true' : 'false'}
              aria-label={t('startDateInputLabel')}
              className={styles.datePicker}
              min={startDateMin}
              onChange={(startDate) => onChangeLeg({ startDate })}
              reactDatePickerProps={{ endDate: endDateTime, selectsStart: true, startDate: startDateTime }}
              ref={startDatePickerRef}
              value={leg.startDate}
            />

            <TimePicker
              aria-errormessage={errors.startDate ? startDateErrorId : undefined}
              aria-invalid={errors.startDate ? 'true' : 'false'}
              aria-label={t('startTimeInputLabel')}
              min={startTimeMin}
              minutesInterval={TIME_OPTIONS_INTERVAL_IN_MINUTES}
              onChange={(startTime) => onChangeLeg({ startTime })}
              value={leg.startTime}
            />
          </div>

          {!!errors.startDate && <p className={styles.errorMessage} id={startDateErrorId} role="alert">
            {errors.startDate}
          </p>}
        </div>

        {renderCheckbox({
          id: autoStartCheckboxId,
          isChecked: leg.isAutoStart,
          isDisabled: !startDateTime || !isFuture(startDateTime),
          label: t('autoStartCheckboxLabel'),
          onChange: (isAutoStart) => onChangeLeg({ isAutoStart }),
        })}

        <div className={styles.field}>
          <label className={styles.label} htmlFor={startLocationId}>{t('startLocationLabel')}</label>

          <LocationPicker
            id={startLocationId}
            inputProps={{ 'aria-label': t('startLocationLabel') }}
            onChange={(startLocation) => onChangeLeg({ startLocation: startLocation || null })}
            value={leg.startLocation}
          />
        </div>
      </div>

      <div className={styles.column}>
        <div aria-labelledby={endTimeLabelId} className={styles.field} role="group">
          <span className={styles.label} id={endTimeLabelId}>{t('endTimeLabel')}</span>

          <div className={styles.dateTimeInputs}>
            <DatePicker
              aria-errormessage={errors.endDate ? endDateErrorId : undefined}
              aria-invalid={errors.endDate ? 'true' : 'false'}
              aria-label={t('endDateInputLabel')}
              className={styles.datePicker}
              min={endDateMin}
              onChange={(endDate) => onChangeLeg({ endDate })}
              reactDatePickerProps={{ endDate: endDateTime, selectsEnd: true, startDate: startDateTime }}
              ref={endDatePickerRef}
              value={leg.endDate}
            />

            <TimePicker
              aria-errormessage={errors.endDate ? endDateErrorId : undefined}
              aria-invalid={errors.endDate ? 'true' : 'false'}
              aria-label={t('endTimeInputLabel')}
              disabled={!isValidDate(leg.endDate)}
              min={endTimeMin}
              minutesInterval={TIME_OPTIONS_INTERVAL_IN_MINUTES}
              onChange={(endTime) => onChangeLeg({ endTime })}
              showDurationFromMin={!!endTimeMin}
              value={leg.endTime}
            />
          </div>

          {!!errors.endDate && <p className={styles.errorMessage} id={endDateErrorId} role="alert">
            {errors.endDate}
          </p>}
        </div>

        {renderCheckbox({
          id: autoEndCheckboxId,
          isChecked: leg.isAutoEnd,
          isDisabled: !endDateTime || !isFuture(endDateTime),
          label: t('autoEndCheckboxLabel'),
          onChange: (isAutoEnd) => onChangeLeg({ isAutoEnd }),
        })}

        <div className={styles.field}>
          <label className={styles.label} htmlFor={endLocationId}>{t('endLocationLabel')}</label>

          <LocationPicker
            id={endLocationId}
            inputProps={{ 'aria-label': t('endLocationLabel') }}
            onChange={(endLocation) => onChangeLeg({ endLocation: endLocation || null })}
            value={leg.endLocation}
          />
        </div>
      </div>
    </div>

    <div className={styles.columns}>
      <div className={styles.column}>
        {renderSelect({
          getOptionLabel: getTeamOptionLabel,
          id: teamSelectId,
          label: t('teamLabel'),
          onChange: (team) => onChangeLeg({ team }),
          options: teamAndTrackingOptions.teams,
          value: leg.team,
        })}

        {renderSelect({
          id: teamMembersSelectId,
          isMulti: true,
          label: t('teamMembersLabel'),
          onChange: (teamMembers) => onChangeLeg({ teamMembers: [...teamMembers] }),
          options: teamAndTrackingOptions.teamMembers,
          renderOptionIcon: renderSubjectOptionIcon,
          value: leg.teamMembers,
        })}
      </div>

      <div className={styles.column}>
        {renderSelect({
          id: teamLeadSelectId,
          label: t('teamLeadLabel'),
          onChange: (teamLead) => onChangeLeg({ teamLead }),
          options: teamAndTrackingOptions.leaders,
          renderOptionIcon: renderSubjectOptionIcon,
          value: leg.teamLead,
        })}

        {renderSelect({
          id: assetsSelectId,
          isMulti: true,
          label: t('assetsLabel'),
          onChange: (assets) => onChangeLeg({ assets: [...assets] }),
          options: teamAndTrackingOptions.assets,
          renderOptionIcon: renderSubjectOptionIcon,
          value: leg.assets,
        })}
      </div>
    </div>
  </div>;
};

export default StaticFields;
