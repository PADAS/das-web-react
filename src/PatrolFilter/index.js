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
const PATROL_STATUS_OPTIONS = [
  { color: '#3E35A3', id: 'active', value: 'Active' },
  { color: '#107283', id: 'scheduled', value: 'Scheduled' },
  { color: '#B62879', id: 'overdue', value: 'Overdue' },
  { color: '#888B8D', id: 'done', value: 'Done' },
  { color: '#E7E7E7', id: 'canceled', value: 'Canceled' },
];
export const PATROL_TEXT_FILTER_DEBOUNCE_TIME = 200;
const CHECKBOX_LIST_ALL_OPTION = { id: 'all', value: 'All' };

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const calculateNewCheckedItems = (clickedItemId, checkedItemIds) => {
  let newCheckedItemsList;

  const uncheckingLastItem = checkedItemIds.length === 1 && checkedItemIds[0] === clickedItemId;
  if (clickedItemId === CHECKBOX_LIST_ALL_OPTION.id || uncheckingLastItem) {
    // Only check the All option if user clicks it or unchecks the rest of the items
    newCheckedItemsList = [CHECKBOX_LIST_ALL_OPTION.id];
  } else {
    // Add or remove the clicked item from the new list and make sure "all" is not checked
    newCheckedItemsList = checkedItemIds.includes(clickedItemId)
      ? checkedItemIds.filter(checkedItemId => checkedItemId !== clickedItemId)
      : [...checkedItemIds, clickedItemId];
    newCheckedItemsList = newCheckedItemsList.filter(checkedItem => checkedItem !== CHECKBOX_LIST_ALL_OPTION.id);
  }

  return newCheckedItemsList;
};

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
    const checkedPatrolTypes = calculateNewCheckedItems(clickedPatrolType.id, patrolFilter.filter.patrol_types);
    updatePatrolFilter({ filter: { patrol_types: checkedPatrolTypes } });

    const isAnyPatrolTypeChecked = checkedPatrolTypes[0] !== CHECKBOX_LIST_ALL_OPTION.id;
    patrolFilterTracker.track(
      `${isAnyPatrolTypeChecked ? 'Set' : 'Clear'} 'Patrol Types' Filter`,
      isAnyPatrolTypeChecked ? `${patrolFilter.filter.patrol_types.length} types` : null
    );
  }, [patrolFilter.filter, updatePatrolFilter]);

  const onStatusFilterChange = useCallback((clickedStatus) => {
    // TODO: Add filter.status to the request in calcPatrolFilterForRequest once backend supports it
    const checkedStatus = calculateNewCheckedItems(clickedStatus.id, patrolFilter.filter.status);
    updatePatrolFilter({ filter: { status: checkedStatus } });

    const isAnyStatusChecked = checkedStatus[0] !== CHECKBOX_LIST_ALL_OPTION.id;
    patrolFilterTracker.track(
      `${isAnyStatusChecked ? 'Set' : 'Clear'} 'Status' Filter`,
      isAnyStatusChecked ? `${patrolFilter.filter.status.length} status` : null
    );
  }, [patrolFilter.filter, updatePatrolFilter]);

  const onSearchChange = useCallback(({ target: { value } }) => {
    setFilterText(value);

    patrolFilterTracker.track('Change Search Text Filter');
  }, []);

  const resetFilters = useCallback(() => {
    updatePatrolFilter({
      filter: {
        leaders: INITIAL_FILTER_STATE.filter.leaders,
        patrol_types: INITIAL_FILTER_STATE.filter.patrol_types,
        status: INITIAL_FILTER_STATE.filter.status,
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
  const statusFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.status, patrolFilter.filter.status);
  const filtersModified = patrolTypesFilterModified || leadersFilterModified || statusFilterModified;

  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, patrolFilter.filter.date_range);

  const leaderFilterOptions = patrolLeaderSchema?.trackedbySchema?.properties?.leader?.enum_ext?.map(({ value }) => value)
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
    checked: patrolFilter.filter.patrol_types.includes(CHECKBOX_LIST_ALL_OPTION.id),
    id: CHECKBOX_LIST_ALL_OPTION.id,
    value: CHECKBOX_LIST_ALL_OPTION.value,
  });

  const statusFilterOptions = PATROL_STATUS_OPTIONS.map(status => ({
    checked: patrolFilter.filter.status.includes(status.id),
    id: status.id,
    value: <div className='statusItem'>
      {<DasIcon color={status.color} iconId='generic_rep' type='events' />}
      {status.value}
    </div>,
  }));
  statusFilterOptions.unshift({
    checked: patrolFilter.filter.status.includes(CHECKBOX_LIST_ALL_OPTION.id),
    id: CHECKBOX_LIST_ALL_OPTION.id,
    value: CHECKBOX_LIST_ALL_OPTION.value,
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
        onStatusFilterChange={onStatusFilterChange}
        leaderFilterOptions={leaderFilterOptions}
        patrolTypeFilterOptions={patrolTypeFilterOptions}
        statusFilterOptions={statusFilterOptions}
        resetFilters={resetFilters}
        resetLeadersFilter={resetFilter('leaders')}
        resetPatrolTypesFilter={resetFilter('patrol_types')}
        resetStatusFilter={resetFilter('status')}
        selectedLeaders={selectedLeaders}
        showResetPatrolTypesFilterButton={patrolTypesFilterModified}
        showResetFiltersButton={filtersModified}
        showResetLeadersFilterButton={leadersFilterModified}
        showResetStatusFilterButton={statusFilterModified}
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
