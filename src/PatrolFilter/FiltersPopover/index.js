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

import patrolFiltersPopoverStyles from './styles.module.scss';
import styles from '../../EventFilter/styles.module.scss';

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const CHECKBOX_LIST_ALL_OPTION = { id: 'all', value: 'All' };
const PATROL_FILTERS_LEADERS_KEY = 'leaders';
const PATROL_FILTERS_PATROL_TYPE_KEY = 'patrol_type';

const FiltersPopover = React.forwardRef(({
  fetchTrackedBySchema,
  patrolFilter,
  patrolLeaderSchema,
  patrolTypes,
  reporters,
  updatePatrolFilter,
  ...rest
}, ref) => {
  const { leaders: selectedLeaderIds, patrol_type: selectedPatrolTypeIds } = patrolFilter.filter;

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

  const onPatrolTypesFilterChange = useCallback((clickedPatrolType) => {
    let newSelectedPatrolTypeIds;

    const uncheckingLastItem = selectedPatrolTypeIds.length === 1 && selectedPatrolTypeIds[0] === clickedPatrolType.id;
    const checkingAllPatrolTypesOption = clickedPatrolType.id === CHECKBOX_LIST_ALL_OPTION.id;
    if (checkingAllPatrolTypesOption || uncheckingLastItem) {
      newSelectedPatrolTypeIds = [CHECKBOX_LIST_ALL_OPTION.id];
    } else {
      if (selectedPatrolTypeIds.includes(clickedPatrolType.id)) {
        newSelectedPatrolTypeIds = selectedPatrolTypeIds.filter(patrolTypeId => patrolTypeId !== clickedPatrolType.id);
      } else {
        newSelectedPatrolTypeIds = [...selectedPatrolTypeIds, clickedPatrolType.id];
      }
      newSelectedPatrolTypeIds = newSelectedPatrolTypeIds.filter(patrolTypeSelected =>
        patrolTypeSelected !== CHECKBOX_LIST_ALL_OPTION.id);
    }

    updatePatrolFilter({ filter: { patrol_type: newSelectedPatrolTypeIds } });

    const isAnyPatrolTypeSelected = !!selectedPatrolTypeIds.length;
    patrolFilterTracker.track(
      `${isAnyPatrolTypeSelected ? 'Set' : 'Clear'} 'Patrol Types' Filter`,
      isAnyPatrolTypeSelected ? `${selectedPatrolTypeIds.length} types` : null
    );
  }, [selectedPatrolTypeIds, updatePatrolFilter]);

  const resetFilters = useCallback(() => {
    updatePatrolFilter({
      filter: {
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
        leaders: INITIAL_FILTER_STATE.filter.leaders,
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
  const filtersModified = patrolTypesFilterModified || leadersFilterModified;

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
            onClick={resetFilter(PATROL_FILTERS_LEADERS_KEY)}
            size='sm'
            type="button"
            variant='light'
          >
            Reset
          </Button>
        </div>
      </div>

      <div className={`${styles.filterRow} ${patrolFiltersPopoverStyles.patrolTypeContainer}`}>
        <div className='header'>
          <label>Patrol Type</label>
          <Button
            className={!patrolTypesFilterModified && 'hidden'}
            onClick={resetFilter(PATROL_FILTERS_PATROL_TYPE_KEY)}
            size='sm'
            type="button"
            variant='light'
          >
            Reset
          </Button>
        </div>
        <CheckboxList
          values={selectedPatrolTypeIds}
          options={patrolTypeFilterOptions}
          onItemChange={onPatrolTypesFilterChange}
        />
      </div>
    </Popover.Content>
  </Popover>;
});

FiltersPopover.propTypes = {
  fetchTrackedBySchema: PropTypes.func.isRequired,
  patrolFilter: PropTypes.shape({
    filters: PropTypes.shape({
      date_range: PropTypes.object,
      patrol_type: PropTypes.arrayOf(PropTypes.string),
      leaders: PropTypes.arrayOf(PropTypes.string),
      text: PropTypes.string,
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
