import React, { useContext } from 'react';
import isEqual from 'react-fast-compare';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClockIcon } from '../../../../../common/images/icons/clock-icon.svg';

import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../../../../ducks/patrol-filter';
import { resetGlobalDateRange, updateGlobalDateRange } from '../../../../../ducks/global-date-range';
import { TrackerContext } from '../../../../../utils/analytics';

import FeedDateFilter from '../../../../../FeedDateFilter';
import Settings from './Settings';

import * as styles from './styles.module.scss';

const DateRangePopover = ({ ref, ...otherProps }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('filters', { keyPrefix: 'patrolFilters.dateRangePopover' });

  const tracker = useContext(TrackerContext);

  const dateRange = useSelector((state) => state.data.patrolFilter.filter.date_range);

  const isDateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, dateRange);

  const onChangeSettings = (patrolsOverlapDateRange) => {
    dispatch(updatePatrolFilter({ filter: { patrols_overlap_daterange: patrolsOverlapDateRange } }));

    tracker.track(patrolsOverlapDateRange ? 'Filter by date range overlap' : 'Filter by start date');
  };

  const onReset = (event) => {
    event.stopPropagation();

    dispatch(resetGlobalDateRange());

    tracker.track('Click reset date range filter');
  };

  return <Popover {...otherProps} className={styles.dateRangePopover} ref={ref}>
    <Popover.Header as="div" className={styles.header}>
      <ClockIcon aria-hidden="true" />

      <h2 className={styles.title}>{t('title')}</h2>

      <button
        className={styles.resetButton}
        disabled={!isDateRangeModified}
        onClick={onReset}
        type="button"
      >
        {t('resetButton')}
      </button>
    </Popover.Header>

    <Popover.Body>
      <FeedDateFilter
        afterClickPreset={(label) => tracker.track('Select date range preset', `Date Range: ${label}`)}
        afterEndChange={() => tracker.track('Change end date filter')}
        afterStartChange={() => tracker.track('Change start date filter')}
        dateRange={dateRange}
        defaultRange={INITIAL_FILTER_STATE.filter.date_range}
        endDateLabel=""
        endMaxDate={null}
        filterSettings={<Settings onChange={onChangeSettings} />}
        nullUpperOverride={INITIAL_FILTER_STATE.filter.date_range.upper}
        onFilterSettingsToggle={() => tracker.track('Click date filter settings button')}
        placement="bottom"
        requireEnd
        startDateLabel=""
        updateFilter={(update) => dispatch(updateGlobalDateRange(update))}
      />
    </Popover.Body>
  </Popover>;
};

export default DateRangePopover;
