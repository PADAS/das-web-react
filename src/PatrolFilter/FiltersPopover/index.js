// Ludwig: All the comments are related to the old implementation of the status filters.
// I did not remove them in case they are useful during the new implementation, but we should delete them

import React from 'react';
import Button from 'react-bootstrap/Button';
// import isEqual from 'react-fast-compare';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import ReportedBySelect from '../../ReportedBySelect';
import CheckboxList from '../../CheckboxList';

import patrolFiltersPopoverStyles from './styles.module.scss';
import styles from '../../EventFilter/styles.module.scss';

// const PATROL_STATUS_CHOICES = [
//   { value: 'cancelled', label: 'Cancelled' },
//   { value: 'overdue', label: 'Overdue' },
//   { value: 'done', label: 'Done' },
//   { value: 'active', label: 'Active' },
//   { value: 'scheduled', label: 'Scheduled' },
// ];

const FiltersPopover = React.forwardRef(({
  onPatrolTypesFilterChange,
  onLeadersFilterChange,
  // onStateSelect,
  patrolLeaderFilterOptions = [],
  patrolTypeFilterOptions = [],
  resetFilters = null,
  resetPatrolTypesFilter = null,
  resetLeadersFilter = null,
  // resetStateFilter,
  selectedLeaders = [],
  showResetPatrolTypesFilterButton = false,
  showResetFiltersButton = false,
  showResetLeadersFilterButton = false,
  // status,
  // stateFilterModified,
  ...rest
}, ref) => <Popover
    {...rest}
    ref={ref}
    className={`${styles.filterPopover} ${styles.filters} ${patrolFiltersPopoverStyles.popover}`}
    id='filter-popover'
  >
  <Popover.Title>
    <div className={styles.popoverTitle}>
      Patrol Filters
      {showResetFiltersButton &&
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
          placeholder='Tracked By...'
          value={selectedLeaders}
        />
        <Button
          className={!showResetLeadersFilterButton && 'hidden'}
          onClick={resetLeadersFilter}
          size='sm'
          type="button"
          variant='light'
        >
          Reset
        </Button>
      </div>
    </div>

    {/*<div className={`${styles.filterRow} ${patrolFiltersPopoverStyles.statusContainer}`}>
      <div className='header'>
        <label>Status</label>
        <Button
          // className={!showResetLeadersFilterButton && 'hidden'}
          // onClick={resetLeadersFilter}
          size='sm'
          type="button"
          variant='light'
        >
          Reset
        </Button>
      </div>
       <ul className={styles.stateList}>
        {PATROL_STATUS_CHOICES.map((choice) => (
          <li
            className={isEqual(choice.value, status) ? styles.activeState : ''}
            key={choice.value}
            onClick={() => onStateSelect(choice)}
          >
            <Button variant='link'>
              {choice.label}
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant='light'
        size='sm'
        disabled={!stateFilterModified}
        onClick={resetStateFilter}
      >
        Reset
      </Button>
        </div> */}

    <div className={`${styles.filterRow} ${patrolFiltersPopoverStyles.patrolTypeContainer}`}>
      <div className='header'>
        <label>Patrol Type</label>
        <Button
          className={!showResetPatrolTypesFilterButton && 'hidden'}
          onClick={resetPatrolTypesFilter}
          size='sm'
          type="button"
          variant='light'
        >
          Reset
        </Button>
      </div>
      <CheckboxList
        items={patrolTypeFilterOptions}
        onItemClick={onPatrolTypesFilterChange}
      />
    </div>
  </Popover.Content>
</Popover>);

FiltersPopover.propTypes = {
  onLeadersFilterChange: PropTypes.func.isRequired,
  onPatrolTypesFilterChange: PropTypes.func.isRequired,
  // onStateSelect,
  patrolLeaderFilterOptions: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string })),
  patrolTypeFilterOptions: PropTypes.arrayOf(PropTypes.shape({
    checked: PropTypes.bool,
    id: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  })),
  resetFilters: PropTypes.func,
  resetLeadersFilter: PropTypes.func,
  resetPatrolTypesFilter: PropTypes.func,
  // resetStateFilter,
  selectedLeaders: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string })),
  showResetFiltersButton: PropTypes.bool,
  showResetLeadersFilterButton: PropTypes.bool,
  showResetPatrolTypesFilterButton: PropTypes.bool,
  // status,
  // stateFilterModified,
};

FiltersPopover.displayName = 'FiltersPopover';

export default FiltersPopover;
