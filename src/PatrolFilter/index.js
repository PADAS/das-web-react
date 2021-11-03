import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import isEqual from 'react-fast-compare';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import uniq from 'lodash/uniq';

import { caseInsensitiveCompare } from '../utils/string';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import { reportedBy } from '../selectors';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { trackEvent } from '../utils/analytics';

import FilterDatePopover from './FilterDatePopover';
import FilterPopover from './FilterPopover';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';
import { ReactComponent as FilterIcon } from '../common/images/icons/filter-icon.svg';
import SearchBar from '../SearchBar';

import patrolFilterStyles from './styles.module.scss';
import styles from '../EventFilter/styles.module.scss';

const PatrolFilter = ({
  children,
  className = '',
  patrolFilter,
  reporters,
  resetGlobalDateRange,
  updatePatrolFilter,
}) => {
  const containerRef = useRef(null);

  const { filter: { date_range, patrol_type: currentFilterReportTypes, leader, text }, status } = patrolFilter;

  const stateFilterModified = !isEqual(INITIAL_FILTER_STATE.status, status);
  const reportedByFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.leader, leader);
  const filterModified = currentFilterReportTypes?.length > 0
    || !isEqual(INITIAL_FILTER_STATE.status, status)
    || reportedByFilterModified;
  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range);

  const [filterText, setFilterText] = useState(patrolFilter.filter.text);

  const onFilterSettingsOptionChange = useCallback((e) => {
    const patrolOverlap = (e.currentTarget.value === 'overlap_dates');
    updatePatrolFilter({ filter: { patrols_overlap_daterange: patrolOverlap } });
    trackEvent('Patrol Filter', patrolOverlap ? 'Filter by date range overlap' : 'Filter by start date');
  }, [updatePatrolFilter]);

  const selectedReporters = useMemo(() =>
    patrolFilter.filter.leader && !!patrolFilter.filter.leader.length
      ? patrolFilter.filter.leader
        .map(id =>
          reporters.find(r => r.id === id)
        ).filter(item => !!item)
      : []
  , [patrolFilter.filter.leader, reporters]);

  const onReportedByChange = useCallback((values) => {
    const hasValue = values && !!values.length;

    if (hasValue) {
      updatePatrolFilter({
        filter: {
          leader: uniq(values.map(({ id }) => id)),
        }
      });
    } else {
      updatePatrolFilter({
        filter: {
          leader: [],
        }
      });
    }
    trackEvent('Patrol Filter', `${hasValue ? 'Set' : 'Clear'} 'Reported By' Filter`, hasValue ? `${values.length} reporters` : null);
  }, [updatePatrolFilter]);

  const updatePatrolFilterDebounced = useRef(debounce(function (update) {
    updatePatrolFilter(update);
  }, 200));


  const onStateSelect = useCallback(({ value }) => {
    updatePatrolFilter({ status: value });
    trackEvent('Patrol Filter', `Select '${value}' State Filter`);
  }, [updatePatrolFilter]);

  const resetPopoverFilters = useCallback(() => {
    updatePatrolFilter({
      status: INITIAL_FILTER_STATE.status,
      filter: {
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
        leader: INITIAL_FILTER_STATE.filter.leader,
      },
    });
    trackEvent('Patrol Filter', 'Click Reset All Filters');
  }, [updatePatrolFilter]);

  const clearDateRange = useCallback((e) => {
    e.stopPropagation();
    resetGlobalDateRange();
    trackEvent('Patrol Filter', 'Click Reset Date Range Filter');
  }, [resetGlobalDateRange]);

  const resetStateFilter = useCallback((e) => {
    e.stopPropagation();
    updatePatrolFilter({ status: INITIAL_FILTER_STATE.status });
    trackEvent('Patrol Filter', 'Click Reset State Filter');
  }, [updatePatrolFilter]);

  const resetReportedByFilter = useCallback((e) => {
    e.stopPropagation();
    updatePatrolFilter({ filter: { leader: INITIAL_FILTER_STATE.filter.leader } });
    trackEvent('Patrol Filter', 'Click Reset Reported By Filter');
  }, [updatePatrolFilter]);

  const onSearchChange = useCallback(({ target: { value } }) => {
    setFilterText(value);
    trackEvent('Patrol Filter', 'Change Search Text Filter');
  }, []);

  const onSearchClear = useCallback((e) => {
    e.stopPropagation();
    setFilterText('');
    trackEvent('Patrol Filter', 'Clear Search Text Filter');
  }, []);

  useEffect(() => {
    if (!caseInsensitiveCompare(filterText, text)) {
      if (!!filterText.length) {
        updatePatrolFilterDebounced.current({
          filter: { text: filterText },
        });
      } else {
        updatePatrolFilter({
          filter: { text: '', },
        });
      }
    }
  }, [filterText]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!caseInsensitiveCompare(filterText, text)) {
      setFilterText(text);
    }
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} className={`${patrolFilterStyles.form} ${className}`} onSubmit={e => e.preventDefault()}>
      <SearchBar
        className={`${styles.search} ${patrolFilterStyles.search}`}
        placeholder='Search Patrols...'
        value={filterText}
        onChange={onSearchChange}
        onClear={onSearchClear}
      />

      <OverlayTrigger
        shouldUpdatePosition={true}
        rootClose
        trigger='click'
        placement='auto'
        overlay={<FilterPopover
          containerRef={containerRef}
          filterModified={filterModified}
          onReportedByChange={onReportedByChange}
          onStateSelect={onStateSelect}
          reportedByFilterModified={reportedByFilterModified}
          resetPopoverFilters={resetPopoverFilters}
          resetReportedByFilter={resetReportedByFilter}
          resetStateFilter={resetStateFilter}
          selectedReporters={selectedReporters}
          status={status}
          stateFilterModified={stateFilterModified}
        />}
        flip={true}
      >
        <Button
          variant={stateFilterModified ? 'primary' : 'light'}
          size='sm'
          className={`${patrolFilterStyles.popoverTrigger} ${patrolFilterStyles.filterButton}`}
          onClick={() => trackEvent('Reports', 'Filters Icon Clicked')}
        >
          <FilterIcon className={styles.filterIcon} />
          <span>Filters</span>
        </Button>
      </OverlayTrigger>

      <OverlayTrigger
        shouldUpdatePosition={true}
        rootClose
        trigger='click'
        placement='auto'
        overlay={<FilterDatePopover
          clearDateRange={clearDateRange}
          containerRef={containerRef}
          dateRangeModified={dateRangeModified}
          onFilterSettingsOptionChange={onFilterSettingsOptionChange}
        />}
        flip={true}
      >
        <Button
          variant={dateRangeModified ? 'primary' : 'light'}
          size='sm'
          className={`${patrolFilterStyles.popoverTrigger} ${patrolFilterStyles.dateFilterButton}`}
          onClick={() => trackEvent('Patrol Filter', 'Date Filter Popover Toggled')}
        >
          <ClockIcon className={styles.clockIcon} />
          <span>Dates</span>
        </Button>
      </OverlayTrigger>

      {children}
    </div>
  );
};

const mapStateToProps = (state) => ({
  patrolFilter: state.data.patrolFilter,
  patrolTypes: state.data.patrolTypes,
  reporters: reportedBy(state),
});

export default connect(mapStateToProps, { resetGlobalDateRange, updatePatrolFilter })(memo(PatrolFilter));
