import React, { memo, useCallback, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'react-fast-compare';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import uniq from 'lodash/uniq';

import { fetchTrackedBySchema } from '../../ducks/trackedby';
import { iconTypeForPatrol } from '../../utils/patrols';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../ducks/patrol-filter';
import { reportedBy } from '../../selectors';
import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../../utils/analytics';

import CheckboxList from '../../CheckboxList';
import DasIcon from '../../DasIcon';
import ReportedBySelect from '../../ReportedBySelect';

import colorVariables from '../../common/styles/vars/colors.module.scss';
import patrolFiltersPopoverStyles from './styles.module.scss';
import styles from '../../EventFilter/styles.module.scss';

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const CHECKBOX_LIST_ALL_OPTION = { id: 'all', value: 'All' };
const PATROL_FILTERS_LEADERS_KEY = 'leaders';
const PATROL_FILTERS_PATROL_TYPE_KEY = 'patrol_type';
const PATROL_FILTERS_STATUS_KEY = 'status';
const PATROL_STATUS_OPTIONS = [
  { color: colorVariables.patrolActiveStatusColor, id: 'active', value: 'Active' },
  { color: colorVariables.patrolScheduledStatusColor, id: 'scheduled', value: 'Scheduled' },
  { color: colorVariables.patrolOverdueStatusColor, id: 'overdue', value: 'Overdue' },
  { color: colorVariables.patrolDoneStatusColor, id: 'done', value: 'Done' },
  { color: colorVariables.patrolCanceledStatusColor, id: 'canceled', value: 'Canceled' },
];

const calculateNewCheckedItems = (clickedItemId, checkedItemIds) => {
  if (clickedItemId === CHECKBOX_LIST_ALL_OPTION.id) {
    return [];
  }
  if (checkedItemIds.includes(clickedItemId)) {
    return checkedItemIds.filter(checkedItemId => checkedItemId !== clickedItemId);
  }
  return [...checkedItemIds, clickedItemId];
};

const FiltersPopover = React.forwardRef(({
  fetchTrackedBySchema,
  patrolFilter,
  patrolLeaderSchema,
  patrolTypes,
  reporters,
  updatePatrolFilter,
  ...rest
}, ref) => {
  const {
    leaders: selectedLeaderIds,
    patrol_type: selectedPatrolTypeIds,
    status: selectedStatusIds,
  } = patrolFilter.filter;

  const onLeadersFilterChange = useCallback((leadersSelected) => {
    const isAnyLeaderSelected = !!leadersSelected?.length;
    updatePatrolFilter({
      filter: { leaders: isAnyLeaderSelected ? uniq(leadersSelected.map(({ id }) => id)) : [] }
    });

    patrolFilterTracker.track(
      `${isAnyLeaderSelected ? 'Set' : 'Clear'} 'Tracked By' Filter`,
      isAnyLeaderSelected ? `${leadersSelected.length} trackers` : null
    );
  }, [updatePatrolFilter]);

  const onStatusFilterChange = useCallback((clickedStatus) => {
    const checkedStatus = calculateNewCheckedItems(clickedStatus.id, selectedStatusIds);
    updatePatrolFilter({ filter: { status: checkedStatus } });

    const isAnyStatusChecked = checkedStatus[0] !== CHECKBOX_LIST_ALL_OPTION.id;
    patrolFilterTracker.track(
      `${isAnyStatusChecked ? 'Set' : 'Clear'} 'Status' Filter`,
      isAnyStatusChecked ? `${selectedStatusIds.length} status` : null
    );
  }, [selectedStatusIds, updatePatrolFilter]);

  const onPatrolTypesFilterChange = useCallback((clickedPatrolType) => {
    const checkedPatrolTypes = calculateNewCheckedItems(clickedPatrolType.id, selectedPatrolTypeIds);
    updatePatrolFilter({ filter: { patrol_type: checkedPatrolTypes } });

    const isAnyPatrolTypeSelected = !!selectedPatrolTypeIds.length;
    patrolFilterTracker.track(
      `${isAnyPatrolTypeSelected ? 'Set' : 'Clear'} 'Patrol Types' Filter`,
      isAnyPatrolTypeSelected ? `${selectedPatrolTypeIds.length} types` : null
    );
  }, [selectedPatrolTypeIds, updatePatrolFilter]);

  const resetFilters = useCallback(() => {
    updatePatrolFilter({
      filter: {
        leaders: INITIAL_FILTER_STATE.filter.leaders,
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
        status: INITIAL_FILTER_STATE.filter.status,
      },
    });

    patrolFilterTracker.track('Click Reset All Filters');
  }, [updatePatrolFilter]);

  const resetFilter = useCallback((filterToReset) => (e) => {
    e.stopPropagation();
    updatePatrolFilter({ filter: { [filterToReset]: INITIAL_FILTER_STATE.filter[filterToReset] } });

    patrolFilterTracker.track(`Click reset ${filterToReset} filter`);
  }, [updatePatrolFilter]);

  useEffect(() => {
    if (isEmpty(patrolLeaderSchema)){
      fetchTrackedBySchema();
    }
  }, [fetchTrackedBySchema, patrolLeaderSchema]);

  const patrolLeaderFilterOptions = patrolLeaderSchema?.trackedbySchema?.properties?.leader?.enum_ext?.map(({ value }) => value)
    || [];
  const selectedLeaders = !!selectedLeaderIds?.length ?
    selectedLeaderIds.map(id => reporters.find(reporter => reporter.id === id)).filter(item => !!item)
    : [];

  const statusFilterOptions = PATROL_STATUS_OPTIONS.map(status => ({
    id: status.id,
    value: <div className='statusItem'>
      {<DasIcon color={status.color} iconId='generic_rep' type='events' />}
      {status.value}
    </div>,
  }));
  statusFilterOptions.unshift({
    id: CHECKBOX_LIST_ALL_OPTION.id,
    value: CHECKBOX_LIST_ALL_OPTION.value,
  });

  const patrolTypeFilterOptions = patrolTypes.map(patrolType => {
    const patrolIconId = iconTypeForPatrol(patrolType);

    return {
      id: patrolType.id,
      value: <div className='patrolTypeItem'>
        {patrolIconId && <DasIcon color='black' iconId={patrolIconId} type='events' />}
        {patrolType.display}
      </div>,
    };
  });
  patrolTypeFilterOptions.unshift({
    id: CHECKBOX_LIST_ALL_OPTION.id,
    value: CHECKBOX_LIST_ALL_OPTION.value,
  });

  const leadersFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.leaders, selectedLeaderIds);
  const patrolTypesFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.patrol_type, selectedPatrolTypeIds);
  const statusFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.status, patrolFilter.filter.status);
  const filtersModified = leadersFilterModified || patrolTypesFilterModified || statusFilterModified;

  const patrolTypesCheckboxListValues = !!selectedPatrolTypeIds.length
    ? selectedPatrolTypeIds : [CHECKBOX_LIST_ALL_OPTION.id];
  const statusCheckboxListValues = !!selectedStatusIds.length ? selectedStatusIds : [CHECKBOX_LIST_ALL_OPTION.id];

  return <Popover
      {...rest}
      ref={ref}
      className={`${styles.filterPopover} ${styles.filters} ${patrolFiltersPopoverStyles.popover}`}
      id='filter-popover'
    >
    <Popover.Title>
      <div className={styles.popoverTitle}>
        Patrol Filters
        {!!filtersModified &&
          <Button
            className={patrolFiltersPopoverStyles.resetAllButton}
            onClick={resetFilters}
            size='sm'
            type="button"
            variant='light'
          >
            Reset All
          </Button>
        }
      </div>
    </Popover.Title>

    <Popover.Content>
      <div className={`${styles.filterRow} ${patrolFiltersPopoverStyles.leadersFilterContainer}`}>
        <label>TRACKED BY</label>
        <div className="select">
          <ReportedBySelect
            className={styles.reportedBySelect}
            isMulti
            onChange={onLeadersFilterChange}
            options={patrolLeaderFilterOptions}
            placeholder='Select Device...'
            value={selectedLeaders}
          />
          <Button
            className={!leadersFilterModified && 'hidden'}
            data-testid='patrolFilter-reset-leaders-button'
            onClick={resetFilter(PATROL_FILTERS_LEADERS_KEY)}
            size='sm'
            type="button"
            variant='light'
          >
            Reset
          </Button>
        </div>
      </div>

      <div className={`${styles.filterRow} ${patrolFiltersPopoverStyles.statusContainer}`}>
        <div className='header'>
          <label>Status</label>
          <Button
            className={!statusFilterModified && 'hidden'}
            data-testid='patrolFilter-reset-status-button'
            onClick={resetFilter(PATROL_FILTERS_STATUS_KEY)}
            size='sm'
            type="button"
            variant='light'
          >
            Reset
          </Button>
        </div>
        <div className='checkboxListContainer' data-testid='patrolFilter-status-checkbox-list'>
          <CheckboxList
            options={statusFilterOptions}
            onItemChange={onStatusFilterChange}
            values={statusCheckboxListValues}
          />
        </div>
      </div>

      <div className={`${styles.filterRow} ${patrolFiltersPopoverStyles.patrolTypeContainer}`}>
        <div className='header'>
          <label>Patrol Type</label>
          <Button
            className={!patrolTypesFilterModified && 'hidden'}
            data-testid='patrolFilter-reset-patrol-type-button'
            onClick={resetFilter(PATROL_FILTERS_PATROL_TYPE_KEY)}
            size='sm'
            type="button"
            variant='light'
          >
            Reset
          </Button>
        </div>
        <div className='checkboxListContainer' data-testid='patrolFilter-patrol-type-checkbox-list'>
          <CheckboxList
            options={patrolTypeFilterOptions}
            onItemChange={onPatrolTypesFilterChange}
            values={patrolTypesCheckboxListValues}
          />
        </div>
      </div>
    </Popover.Content>
  </Popover>;
});

FiltersPopover.propTypes = {
  fetchTrackedBySchema: PropTypes.func.isRequired,
  patrolFilter: PropTypes.shape({
    filters: PropTypes.shape({
      patrol_type: PropTypes.arrayOf(PropTypes.string),
      leaders: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
  patrolLeaderSchema: PropTypes.shape({
    trackedbySchema: PropTypes.shape({
      properties: PropTypes.shape({
        leader: PropTypes.shape({
          enum_ext: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.object })),
        }),
      }),
    }),
  }).isRequired,
  patrolTypes: PropTypes.arrayOf(PropTypes.shape({
    display: PropTypes.string,
    id: PropTypes.string,
    icon_id: PropTypes.string,
  })).isRequired,
  reporters: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string })).isRequired,
  updatePatrolFilter: PropTypes.func.isRequired,
};

FiltersPopover.displayName = 'FiltersPopover';

const mapStateToProps = (state) => ({
  patrolFilter: state.data.patrolFilter,
  patrolLeaderSchema: state.data.patrolLeaderSchema,
  patrolTypes: state.data.patrolTypes,
  reporters: reportedBy(state),
});

export default connect(
  mapStateToProps,
  { fetchTrackedBySchema, updatePatrolFilter },
  null,
  { forwardRef: true }
)(memo(FiltersPopover));
