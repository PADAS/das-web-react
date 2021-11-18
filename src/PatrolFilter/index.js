import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import isEqual from 'react-fast-compare';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PropTypes from 'prop-types';

import { caseInsensitiveCompare } from '../utils/string';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../utils/analytics';

import DateRangePopover from './DateRangePopover';
import FiltersPopover from './FiltersPopover';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';
import { ReactComponent as FilterIcon } from '../common/images/icons/filter-icon.svg';
import SearchBar from '../SearchBar';

import patrolFilterStyles from './styles.module.scss';
import styles from '../EventFilter/styles.module.scss';

const PATROL_FILTER_BY_DATE_RANGE_OVERLAP = 'overlap_dates';
export const PATROL_TEXT_FILTER_DEBOUNCE_TIME = 200;

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const PatrolFilter = ({
  className,
  patrolFilter,
  resetGlobalDateRange,
  updatePatrolFilter,
}) => {
  const containerRef = useRef(null);

  const [filterText, setFilterText] = useState(patrolFilter.filter.text);

  const updatePatrolFilterDebounced = useRef(debounce((update) => {
    updatePatrolFilter(update);
  }, PATROL_TEXT_FILTER_DEBOUNCE_TIME));

  const onFilterSettingsOptionChange = useCallback((e) => {
    const patrolOverlap = e.currentTarget.value === PATROL_FILTER_BY_DATE_RANGE_OVERLAP;
    updatePatrolFilter({ filter: { patrols_overlap_daterange: patrolOverlap } });

    patrolFilterTracker.track(patrolOverlap ? 'Filter by date range overlap' : 'Filter by start date');
  }, [updatePatrolFilter]);

  const onSearchChange = useCallback(({ target: { value } }) => {
    setFilterText(value);

    patrolFilterTracker.track('Change Search Text Filter');
  }, []);

  const resetDateRange = useCallback((e) => {
    e.stopPropagation();
    resetGlobalDateRange();

    patrolFilterTracker.track('Click Reset Date Range Filter');
  }, [resetGlobalDateRange]);

  const resetSearch = useCallback((e) => {
    e.stopPropagation();
    setFilterText('');

    patrolFilterTracker.track('Clear Search Text Filter');
  }, []);

  useEffect(() => {
    if (!caseInsensitiveCompare(filterText, patrolFilter.filter.text)) {
      if (!!filterText.length) {
        updatePatrolFilterDebounced.current({ filter: { text: filterText } });
      } else {
        updatePatrolFilter({ filter: { text: '' } });
      }
    }
  }, [filterText]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!caseInsensitiveCompare(filterText, patrolFilter.filter.text)) {
      setFilterText(patrolFilter.filter.text);
    }
  }, [patrolFilter.filter.text]); // eslint-disable-line react-hooks/exhaustive-deps

  const leadersFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.leaders, patrolFilter.filter.leaders);
  const patrolTypesFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.patrol_type, patrolFilter.filter.patrol_type);
  const filtersModified = patrolTypesFilterModified || leadersFilterModified;
  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, patrolFilter.filter.date_range);

  return <div
      ref={containerRef}
      className={`${patrolFilterStyles.form} ${className}`}
      onSubmit={e => e.preventDefault()}
    >
    <SearchBar
      className={`${styles.search} ${patrolFilterStyles.search}`}
      placeholder='Search Patrols...'
      value={filterText}
      onChange={onSearchChange}
      onClear={resetSearch}
    />

    <OverlayTrigger
      shouldUpdatePosition={true}
      rootClose
      trigger='click'
      placement='auto'
      overlay={<FiltersPopover />}
      flip={true}
    >
      <Button
        variant={filtersModified ? 'primary' : 'light'}
        size='sm'
        className={`${patrolFilterStyles.popoverTrigger} ${patrolFilterStyles.filterButton}`}
        onClick={() => patrolFilterTracker.track('Filters Icon Clicked')}
        data-testid="patrolFilter-filtersButton"
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
      overlay={<DateRangePopover
        containerRef={containerRef}
        onFilterSettingsOptionChange={onFilterSettingsOptionChange}
        resetButtonDisabled={!dateRangeModified}
        resetDateRange={resetDateRange}
      />}
      flip={true}
    >
      <Button
        variant={dateRangeModified ? 'primary' : 'light'}
        size='sm'
        className={`${patrolFilterStyles.popoverTrigger} ${patrolFilterStyles.dateFilterButton}`}
        onClick={() => patrolFilterTracker.track('Date Filter Popover Toggled')}
        data-testid="patrolFilter-dateRangeButton"
      >
        <ClockIcon className={styles.clockIcon} />
        <span>Dates</span>
      </Button>
    </OverlayTrigger>
  </div>;
};

PatrolFilter.defaultProps = { className: '' };

PatrolFilter.propTypes = {
  className: PropTypes.string,
  patrolFilter: PropTypes.shape({
    filters: PropTypes.shape({
      date_range: PropTypes.object,
      patrol_type: PropTypes.arrayOf(PropTypes.string),
      leaders: PropTypes.arrayOf(PropTypes.string),
      text: PropTypes.string,
    }),
  }).isRequired,
  resetGlobalDateRange: PropTypes.func.isRequired,
  updatePatrolFilter: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  patrolFilter: state.data.patrolFilter,
});

export default connect(mapStateToProps, { resetGlobalDateRange, updatePatrolFilter })(memo(PatrolFilter));
