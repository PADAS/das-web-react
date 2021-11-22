import React, { memo, useState, useCallback, useEffect, /* useMemo, */ useRef } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';

import { updatePatrolFilter, INITIAL_FILTER_STATE } from '../ducks/patrol-filter';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../utils/analytics';
import { caseInsensitiveCompare } from '../utils/string';

import PatrolFilterDateRangeSelector from '../PatrolFilter/DateRange';
import PatrolFilterSettings from '../PatrolFilter/PatrolFilterSettings';
import SearchBar from '../SearchBar';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from '../EventFilter/styles.module.scss';
import patrolFilterStyles from './styles.module.scss';

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const PatrolFilter = (props) => {
  const { children, className = '', patrolFilter, resetGlobalDateRange, updatePatrolFilter } = props;
  const { filter: { date_range, text } } = patrolFilter;

  const containerRef = useRef(null);

  const onFilterSettingsOptionChange = useCallback((e) => {
    const patrolOverlap = (e.currentTarget.value === 'overlap_dates');
    updatePatrolFilter({ filter: { patrols_overlap_daterange: patrolOverlap } });
    patrolFilterTracker.track( patrolOverlap ? 'Filter by date range overlap' : 'Filter by start date');
  }, [updatePatrolFilter]);

  const [filterText, setFilterText] = useState(patrolFilter.filter.text);

  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range);

  const updatePatrolFilterDebounced = useRef(debounce(function (update) {
    updatePatrolFilter(update);
  }, 200));

  const clearDateRange = useCallback((e) => {
    e.stopPropagation();
    resetGlobalDateRange();
    patrolFilterTracker.track('Click Reset Date Range Filter');
  }, [resetGlobalDateRange]);

  const onFilterSettingsToggle = useCallback(() => {
    patrolFilterTracker.track('Click Date Filter Settings button');
  }, []);

  const onDateFilterIconClicked = useCallback((e) => {
    patrolFilterTracker.track('Date Filter Popover Toggled');
  }, []);

  const onSearchChange = useCallback(({ target: { value } }) => {
    setFilterText(value);
    patrolFilterTracker.track('Change Search Text Filter');
  }, []);

  const onSearchClear = useCallback((e) => {
    e.stopPropagation();
    setFilterText('');
    patrolFilterTracker.track('Clear Search Text Filter');
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

  const FilterDatePopover = <Popover className={styles.filterPopover} id='filter-date-popover'>
    <Popover.Title>
      <div className={styles.popoverTitle}>
        <ClockIcon />Date Range
        <Button type="button" variant='light' size='sm'
          onClick={clearDateRange} disabled={!dateRangeModified}>Reset</Button>
      </div>
    </Popover.Title>
    <Popover.Content>
      <PatrolFilterDateRangeSelector placement='bottom' onFilterSettingsToggle={onFilterSettingsToggle}
        endDateLabel='' startDateLabel='' container={containerRef} filterSettings={<PatrolFilterSettings handleFilterOptionChange={onFilterSettingsOptionChange} />} />
    </Popover.Content>
  </Popover>;

  return <div ref={containerRef} className={`${patrolFilterStyles.form} ${className}`} onSubmit={e => e.preventDefault()}>
    <SearchBar className={`${styles.search} ${patrolFilterStyles.search}`} placeholder='Search Patrols...' value={filterText}
        onChange={onSearchChange} onClear={onSearchClear} />
    <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={FilterDatePopover} flip={true}>
      <Button variant={dateRangeModified ? 'primary' : 'light'} size='sm' className={`${patrolFilterStyles.popoverTrigger} ${patrolFilterStyles.dateFilterButton}`} onClick={onDateFilterIconClicked}>
        <ClockIcon className={styles.clockIcon} />
        <span>Dates</span>
      </Button>
    </OverlayTrigger>
    {children}
  </div>;
};

const mapStateToProps = (state) =>
  ({
    patrolFilter: state.data.patrolFilter,
    patrolTypes: state.data.patrolTypes,
  });

export default connect(mapStateToProps, { resetGlobalDateRange, updatePatrolFilter })(memo(PatrolFilter));
