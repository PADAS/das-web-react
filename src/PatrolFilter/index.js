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
import { iconTypeForPatrol } from '../utils/patrols';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import { reportedBy } from '../selectors';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../utils/analytics';

import DasIcon from '../DasIcon';
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
  fetchTrackedBySchema,
  patrolFilter,
  patrolLeaderSchema,
  patrolTypes,
  reporters,
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

  const onLeadersFilterChange = useCallback((leadersSelected) => {
    // TODO: Add filter.leaders to the request in calcPatrolFilterForRequest once backend supports it
    const isAnyLeaderSelected = !!leadersSelected?.length;
    updatePatrolFilter({
      filter: { leaders: isAnyLeaderSelected ? uniq(leadersSelected.map(({ id }) => id)) : [] }
    });

    patrolFilterTracker.track(
      `${isAnyLeaderSelected ? 'Set' : 'Clear'} 'Tracked By' Filter`,
      isAnyLeaderSelected ? `${leadersSelected.length} trackers` : null
    );
  }, [updatePatrolFilter]);

  const onPatrolTypesFilterChange = useCallback((clickedPatrolType) => {
    // TODO: Add filter.patrol_types to the request in calcPatrolFilterForRequest once backend supports it
    let patrolTypesSelected;

    const uncheckingLastItem = patrolFilter.filter.patrol_types.length === 1
      && patrolFilter.filter.patrol_types[0] === clickedPatrolType.id;
    if (clickedPatrolType.id === 'all' || uncheckingLastItem) {
      patrolTypesSelected = ['all'];
    } else {
      // Add or remove the clicked checkbox from the filtering and make sure "all" is not checked
      patrolTypesSelected = patrolFilter.filter.patrol_types.includes(clickedPatrolType.id)
        ? patrolFilter.filter.patrol_types.filter(patrolTypeId => patrolTypeId !== clickedPatrolType.id)
        : [...patrolFilter.filter.patrol_types, clickedPatrolType.id];
      patrolTypesSelected = patrolTypesSelected.filter(patrolTypeSelected => patrolTypeSelected !== 'all');
    }

    updatePatrolFilter({ filter: { patrol_types: patrolTypesSelected } });

    const isAnyPatrolTypeSelected = !!patrolFilter.filter.patrol_types.length;
    patrolFilterTracker.track(
      `${isAnyPatrolTypeSelected ? 'Set' : 'Clear'} 'Patrol Types' Filter`,
      isAnyPatrolTypeSelected ? `${patrolFilter.filter.patrol_types.length} types` : null
    );
  }, [patrolFilter.filter, updatePatrolFilter]);

  const onSearchChange = useCallback(({ target: { value } }) => {
    setFilterText(value);

    patrolFilterTracker.track('Change Search Text Filter');
  }, []);

  const resetFilters = useCallback(() => {
    updatePatrolFilter({
      filter: {
        patrol_types: INITIAL_FILTER_STATE.filter.patrol_types,
        leaders: INITIAL_FILTER_STATE.filter.leaders,
      },
    });

    patrolFilterTracker.track('Click Reset All Filters');
  }, [updatePatrolFilter]);

  const resetDateRange = useCallback((e) => {
    e.stopPropagation();
    resetGlobalDateRange();

    patrolFilterTracker.track('Click Reset Date Range Filter');
  }, [resetGlobalDateRange]);

  const resetFilter = useCallback((filterToReset) => (e) => {
    e.stopPropagation();
    updatePatrolFilter({ filter: { [filterToReset]: INITIAL_FILTER_STATE.filter[filterToReset] } });

    patrolFilterTracker.track(`Click reset ${filterToReset} filter`);
  }, [updatePatrolFilter]);

  const resetSearch = useCallback((e) => {
    e.stopPropagation();
    setFilterText('');

    patrolFilterTracker.track('Clear Search Text Filter');
  }, []);

  useEffect(() => {
    if (isEmpty(patrolLeaderSchema)){
      fetchTrackedBySchema();
    }
  }, [fetchTrackedBySchema, patrolLeaderSchema]);

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
  const patrolTypesFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.patrol_types, patrolFilter.filter.patrol_types);
  const filtersModified = patrolTypesFilterModified || leadersFilterModified;
  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, patrolFilter.filter.date_range);

  const patrolLeaderFilterOptions = patrolLeaderSchema?.trackedbySchema?.properties?.leader?.enum_ext?.map(({ value }) => value)
    || [];
  const selectedLeaders = !!patrolFilter.filter.leaders?.length ?
    patrolFilter.filter.leaders.map(id => reporters.find(reporter => reporter.id === id)).filter(item => !!item)
    : [];

  const patrolTypeFilterOptions = patrolTypes.map(patrolType => {
    const patrolIconId = iconTypeForPatrol(patrolType);

    return {
      checked: patrolFilter.filter.patrol_types.includes(patrolType.id),
      id: patrolType.id,
      value: <div className='patrolTypeItem'>
        {patrolIconId && <DasIcon color='black' iconId={patrolIconId} type='events' />}
        {patrolType.display}
      </div>,
    };
  });
  patrolTypeFilterOptions.unshift({
    checked: patrolFilter.filter.patrol_types.includes('all'),
    id: 'all',
    value: 'All',
  });

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
      overlay={<FiltersPopover
        onPatrolTypesFilterChange={onPatrolTypesFilterChange}
        onLeadersFilterChange={onLeadersFilterChange}
        patrolLeaderFilterOptions={patrolLeaderFilterOptions}
        patrolTypeFilterOptions={patrolTypeFilterOptions}
        resetFilters={resetFilters}
        resetPatrolTypesFilter={resetFilter('patrol_types')}
        resetLeadersFilter={resetFilter('leaders')}
        selectedLeaders={selectedLeaders}
        showResetPatrolTypesFilterButton={patrolTypesFilterModified}
        showResetFiltersButton={filtersModified}
        showResetLeadersFilterButton={leadersFilterModified}
      />}
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
  fetchTrackedBySchema: PropTypes.func.isRequired,
  patrolFilter: PropTypes.shape({
    filters: PropTypes.shape({
      date_range: PropTypes.object,
      patrol_types: PropTypes.arrayOf(PropTypes.string),
      leaders: PropTypes.arrayOf(PropTypes.string),
      text: PropTypes.string,
    }),
  }).isRequired,
  patrolLeaderSchema: PropTypes.shape({
    trackedbySchema: PropTypes.shape({
      properties: PropTypes.shape({
        leader: PropTypes.shape({
          enum_ext: PropTypes.arrayOf(
            PropTypes.shape({ value: PropTypes.object })
          ),
        }),
      }),
    }),
  }).isRequired,
  reporters: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string })
  ).isRequired,
  resetGlobalDateRange: PropTypes.func.isRequired,
  updatePatrolFilter: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  patrolFilter: state.data.patrolFilter,
  patrolLeaderSchema: state.data.patrolLeaderSchema,
  patrolTypes: state.data.patrolTypes,
  reporters: reportedBy(state),
});

export default connect(
  mapStateToProps,
  { fetchTrackedBySchema, resetGlobalDateRange, updatePatrolFilter }
)(memo(PatrolFilter));
