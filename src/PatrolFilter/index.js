// Ludwig: All the comments are related to the old implementation of the status filters.
// I did not remove them in case they are useful during the new implementation, but we should delete them

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import isEqual from 'react-fast-compare';
import isEmpty from 'lodash/isEmpty';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PropTypes from 'prop-types';
import uniq from 'lodash/uniq';

import { caseInsensitiveCompare } from '../utils/string';
import { fetchTrackedBySchema } from '../ducks/trackedby';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import { reportedBy } from '../selectors';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { trackEvent } from '../utils/analytics';

import FilterDatePopover from './FilterDatePopover';
import FiltersPopover from './FiltersPopover';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';
import { ReactComponent as FilterIcon } from '../common/images/icons/filter-icon.svg';
import SearchBar from '../SearchBar';

import patrolFilterStyles from './styles.module.scss';
import styles from '../EventFilter/styles.module.scss';

const PATROL_FILTER_BY_DATE_RANGE_OVERLAP = 'overlap_dates';
export const PATROL_TEXT_FILTER_DEBOUNCE_TIME = 200;

const PatrolFilter = ({
  className,
  fetchTrackedBySchema,
  patrolFilter,
  patrolLeaderSchema,
  reporters,
  resetGlobalDateRange,
  updatePatrolFilter,
}) => {
  const containerRef = useRef(null);

  const { filter: { date_range, patrol_type: currentFilterReportTypes, leaders, text }, /* status */ } = patrolFilter;

  // const stateFilterModified = !isEqual(INITIAL_FILTER_STATE.status, status);
  const trackedByFilterModified = INITIAL_FILTER_STATE.filter.leaders !== leaders;
  const filtersModified = currentFilterReportTypes?.length > 0
    // || stateFilterModified
    || trackedByFilterModified;
  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range);

  const patrolLeaders = patrolLeaderSchema?.trackedbySchema?.properties?.leader?.enum_ext?.map(({ value }) => value)
    || [];
  const selectedLeaders = !!patrolFilter.filter.leaders?.length ?
    patrolFilter.filter.leaders.map(id => reporters.find(reporter => reporter.id === id)).filter(item => !!item)
    : [];

  const [filterText, setFilterText] = useState(patrolFilter.filter.text);

  const onFilterSettingsOptionChange = useCallback((e) => {
    const patrolOverlap = e.currentTarget.value === PATROL_FILTER_BY_DATE_RANGE_OVERLAP;
    updatePatrolFilter({ filter: { patrols_overlap_daterange: patrolOverlap } });

    trackEvent('Patrol Filter', patrolOverlap ? 'Filter by date range overlap' : 'Filter by start date');
  }, [updatePatrolFilter]);

  const onTrackedByChange = useCallback((trackedBySelectedValues) => {
    // TODO: Add filter.leaders to the request in calcPatrolFilterForRequest once backend supports it
    const isAnyLeaderSelected = !!trackedBySelectedValues?.length;
    updatePatrolFilter({
      filter: {
        leaders: isAnyLeaderSelected ? uniq(trackedBySelectedValues.map(({ id }) => id)) : [],
      }
    });

    trackEvent(
      'Patrol Filter',
      `${isAnyLeaderSelected ? 'Set' : 'Clear'} 'Tracked By' Filter`,
      isAnyLeaderSelected ? `${trackedBySelectedValues.length} trackers` : null
    );
  }, [updatePatrolFilter]);

  const onSearchChange = useCallback(({ target: { value } }) => {
    setFilterText(value);

    trackEvent('Patrol Filter', 'Change Search Text Filter');
  }, []);

  const updatePatrolFilterDebounced = useRef(debounce((update) => {
    updatePatrolFilter(update);
  }, PATROL_TEXT_FILTER_DEBOUNCE_TIME));

  // const onStateSelect = useCallback(({ value }) => {
  //   updatePatrolFilter({ status: value });
  //   trackEvent('Patrol Filter', `Select '${value}' State Filter`);
  // }, [updatePatrolFilter]);

  const resetFilters = useCallback(() => {
    updatePatrolFilter({
      // status: INITIAL_FILTER_STATE.status,
      filter: {
        // patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
        leaders: INITIAL_FILTER_STATE.filter.leaders,
      },
    });

    trackEvent('Patrol Filter', 'Click Reset All Filters');
  }, [updatePatrolFilter]);

  const clearDateRange = useCallback((e) => {
    e.stopPropagation();
    resetGlobalDateRange();

    trackEvent('Patrol Filter', 'Click Reset Date Range Filter');
  }, [resetGlobalDateRange]);

  // const resetStateFilter = useCallback((e) => {
  //   e.stopPropagation();
  //   updatePatrolFilter({ status: INITIAL_FILTER_STATE.status });
  //   trackEvent('Patrol Filter', 'Click Reset State Filter');
  // }, [updatePatrolFilter]);

  const resetTrackedByFilter = useCallback((e) => {
    e.stopPropagation();
    updatePatrolFilter({ filter: { leaders: INITIAL_FILTER_STATE.filter.leaders } });

    trackEvent('Patrol Filter', 'Click Reset Reported By Filter');
  }, [updatePatrolFilter]);

  const onSearchClear = useCallback((e) => {
    e.stopPropagation();
    setFilterText('');

    trackEvent('Patrol Filter', 'Clear Search Text Filter');
  }, []);

  useEffect(() => {
    if (isEmpty(patrolLeaderSchema)){
      fetchTrackedBySchema();
    }
  }, [fetchTrackedBySchema, patrolLeaderSchema]);

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
      onClear={onSearchClear}
    />

    <OverlayTrigger
      shouldUpdatePosition={true}
      rootClose
      trigger='click'
      placement='auto'
      overlay={<FiltersPopover
        onTrackedByChange={onTrackedByChange}
        // onStateSelect={onStateSelect}
        patrolLeaders={patrolLeaders}
        resetFilters={resetFilters}
        resetTrackedByFilter={resetTrackedByFilter}
        // resetStateFilter={resetStateFilter}
        selectedLeaders={selectedLeaders}
        showResetFiltersButton={filtersModified}
        showResetTrackedByButton={trackedByFilterModified}
        // status={status}
        // stateFilterModified={stateFilterModified}
      />}
      flip={true}
    >
      <Button
        variant={filtersModified ? 'primary' : 'light'}
        size='sm'
        className={`${patrolFilterStyles.popoverTrigger} ${patrolFilterStyles.filterButton}`}
        onClick={() => trackEvent('Reports', 'Filters Icon Clicked')}
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
        data-testid="patrolFilter-dateRangeButton"
      >
        <ClockIcon className={styles.clockIcon} />
        <span>Dates</span>
      </Button>
    </OverlayTrigger>
  </div>;
};

PatrolFilter.defaultProps = {
  className: '',
};

PatrolFilter.propTypes = {
  className: PropTypes.string,
  fetchTrackedBySchema: PropTypes.func.isRequired,
  patrolFilter: PropTypes.shape({
    filters: PropTypes.shape({
      date_range: PropTypes.object,
      // patrol_type: PropTypes.,
      leaders: PropTypes.arrayOf(PropTypes.string),
      text: PropTypes.string,
    }),
  }).isRequired,
  patrolLeaderSchema: PropTypes.shape({
    trackedbySchema: PropTypes.shape({
      properties: PropTypes.shape({
        leader: PropTypes.shape({
          enum_ext: PropTypes.arrayOf(
            PropTypes.shape({
              value: PropTypes.object,
            })
          ),
        }),
      }),
    }),
  }).isRequired,
  reporters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
    })
  ).isRequired,
  resetGlobalDateRange: PropTypes.func.isRequired,
  updatePatrolFilter: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  patrolFilter: state.data.patrolFilter,
  patrolLeaderSchema: state.data.patrolLeaderSchema,
  // patrolTypes: state.data.patrolTypes,
  reporters: reportedBy(state),
});

export default connect(
  mapStateToProps,
  { fetchTrackedBySchema, resetGlobalDateRange, updatePatrolFilter }
)(memo(PatrolFilter));
