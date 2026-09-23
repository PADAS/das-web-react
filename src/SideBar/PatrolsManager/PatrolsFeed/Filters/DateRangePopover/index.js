import React, { useContext, useId, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { isValid, parseISO, subSeconds } from 'date-fns';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  calcFriendlyDurationString,
  endOfToday,
  formatDateToLocalISO,
  generateDaysAgoDate,
  generateMonthsAgoDate,
  generateWeeksAgoDate,
} from '../../../../../utils/datetime';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../../../../ducks/patrol-filter';
import { resetGlobalDateRange, updateGlobalDateRange } from '../../../../../ducks/global-date-range';
import { TrackerContext } from '../../../../../utils/analytics';
import useModalPopover from '../utils/useModalPopover';

import DateTimePicker, { EMPTY_DATE_TIME_VALUE } from '../../../../../DateTimePicker';
import Settings from './Settings';

import * as styles from './styles.module.scss';

const MIN_DATE_TIME = formatDateToLocalISO(new Date('2000-01-01'));

// A preset up to the present runs to the end of the day, which is how the feed
// reaches the patrols scheduled later today.
const DATE_RANGE_PRESETS = [
  { getLower: () => generateDaysAgoDate(0), getUpper: () => endOfToday(), id: 'today', trackingLabel: 'today' },
  {
    getLower: () => generateDaysAgoDate(1),
    getUpper: () => subSeconds(generateDaysAgoDate(0), 1),
    id: 'yesterday',
    trackingLabel: 'yesterday',
  },
  {
    getLower: () => generateWeeksAgoDate(1),
    getUpper: () => endOfToday(),
    id: 'lastSevenDays',
    trackingLabel: 'last week',
  },
  {
    getLower: () => generateDaysAgoDate(30),
    getUpper: () => endOfToday(),
    id: 'lastThirtyDays',
    trackingLabel: 'last 30 days',
  },
  {
    getLower: () => generateMonthsAgoDate(3),
    getUpper: () => endOfToday(),
    id: 'lastThreeMonths',
    trackingLabel: 'last three months',
  },
];

const DateRangePopover = ({ className = '', onClose, ref, trigger, ...otherProps }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('filters', { keyPrefix: 'patrolFilters.dateRangePopover' });

  const tracker = useContext(TrackerContext);

  const dateRange = useSelector((state) => state.data.patrolFilter.filter.date_range);
  const patrolsOverlapDateRange = useSelector((state) => state.data.patrolFilter.filter.patrols_overlap_daterange);

  const bodyRef = useRef(null);

  const endDateLabelId = useId();
  const startDateLabelId = useId();

  // A date typed halfway is no date yet, so it is held here rather than stored
  // until it parses.
  const [endDateTimeDraft, setEndDateTimeDraft] = useState(null);
  const [startDateTimeDraft, setStartDateTimeDraft] = useState(null);

  const { focusPopover, onKeyDown } = useModalPopover(bodyRef, trigger, onClose);

  // A range with no end runs until now, as the Events feed can leave it.
  const endDate = dateRange.upper ? new Date(dateRange.upper) : null;
  const isDatesModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, dateRange)
    || INITIAL_FILTER_STATE.filter.patrols_overlap_daterange !== patrolsOverlapDateRange;
  const startDate = dateRange.lower ? new Date(dateRange.lower) : null;

  const updateDateRange = (dateRangeUpdate) => dispatch(updateGlobalDateRange({ ...dateRange, ...dateRangeUpdate }));

  const onChangeEndDateTime = (newEndDateTime) => {
    const newEndDate = parseISO(newEndDateTime);

    if (isValid(newEndDate)) {
      setEndDateTimeDraft(null);

      updateDateRange({ upper: newEndDate.toISOString() });

      tracker.track('Change end date filter');
    } else {
      setEndDateTimeDraft(newEndDateTime);
    }
  };

  const onChangeSettings = (patrolsOverlapDateRange) => {
    dispatch(updatePatrolFilter({ filter: { patrols_overlap_daterange: patrolsOverlapDateRange } }));

    tracker.track(patrolsOverlapDateRange ? 'Filter by date range overlap' : 'Filter by start date');
  };

  const onChangeStartDateTime = (newStartDateTime) => {
    const newStartDate = parseISO(newStartDateTime);

    if (isValid(newStartDate)) {
      setStartDateTimeDraft(null);

      updateDateRange({ lower: newStartDate.toISOString() });

      tracker.track('Change start date filter');
    } else {
      setStartDateTimeDraft(newStartDateTime);
    }
  };

  const onClickPreset = (preset) => {
    setEndDateTimeDraft(null);
    setStartDateTimeDraft(null);

    updateDateRange({ lower: preset.getLower().toISOString(), upper: preset.getUpper().toISOString() });

    tracker.track('Select date range preset', `Date Range: ${preset.trackingLabel}`);
  };

  // The reset button leaves with the filters it clears, so focus moves on to
  // the popover rather than dropping to the page.
  const onReset = () => {
    setEndDateTimeDraft(null);
    setStartDateTimeDraft(null);

    dispatch(resetGlobalDateRange());
    dispatch(updatePatrolFilter({
      filter: { patrols_overlap_daterange: INITIAL_FILTER_STATE.filter.patrols_overlap_daterange },
    }));

    focusPopover();

    tracker.track('Click reset date filters');
  };

  return <Popover
    aria-label={t('title')}
    aria-modal="true"
    className={`${styles.dateRangePopover} ${className}`}
    onKeyDown={onKeyDown}
    ref={ref}
    role="dialog"
    tabIndex={-1}
    {...otherProps}
    >
    <Popover.Body className={styles.body} ref={bodyRef}>
      <div className={styles.rangeSection}>
        <div className={styles.rangeDescriptionRow}>
          <p aria-live="polite" className={styles.rangeDescription}>
            {calcFriendlyDurationString(startDate, endDate)}
          </p>

          {isDatesModified && <button
            aria-label={t('resetButtonLabel')}
            className={styles.resetButton}
            onClick={onReset}
            type="button"
          >
            {t('resetButton')}
          </button>}
        </div>

        <div className={styles.dateField}>
          <span className={styles.label} id={startDateLabelId}>{t('startDateLabel')}</span>

          <DateTimePicker
            // A date that does not parse, such as February 31, is left unapplied.
            aria-invalid={!!startDateTimeDraft}
            aria-labelledby={startDateLabelId}
            max={endDate ? formatDateToLocalISO(endDate) : undefined}
            min={MIN_DATE_TIME}
            onChange={onChangeStartDateTime}
            required
            value={startDateTimeDraft ?? (startDate ? formatDateToLocalISO(startDate) : EMPTY_DATE_TIME_VALUE)}
          />
        </div>

        <div className={styles.dateField}>
          <span className={styles.label} id={endDateLabelId}>{t('endDateLabel')}</span>

          <DateTimePicker
            aria-invalid={!!endDateTimeDraft}
            aria-labelledby={endDateLabelId}
            min={startDate ? formatDateToLocalISO(startDate) : MIN_DATE_TIME}
            onChange={onChangeEndDateTime}
            value={endDateTimeDraft ?? (endDate ? formatDateToLocalISO(endDate) : EMPTY_DATE_TIME_VALUE)}
          />
        </div>
      </div>

      <div aria-label={t('presetsGroupLabel')} className={styles.presets} role="group">
        {DATE_RANGE_PRESETS.map((preset) => <button
          className={styles.presetButton}
          key={preset.id}
          onClick={() => onClickPreset(preset)}
          type="button"
        >
          {t(`presetButtons.${preset.id}`)}
        </button>)}
      </div>

      <div className={styles.settingsSection}>
        <Settings className={styles.settingsList} onChange={onChangeSettings} />
      </div>
    </Popover.Body>
  </Popover>;
};

export default DateRangePopover;
