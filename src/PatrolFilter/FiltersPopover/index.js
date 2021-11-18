// Ludwig: All the comments are related to the old implementation of the status filters.
// I did not remove them in case they are useful during the new implementation, but we should delete them

import React from 'react';
import Button from 'react-bootstrap/Button';
// import isEqual from 'react-fast-compare';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import ReportedBySelect from '../../ReportedBySelect';

import patrolFilterStyles from './../styles.module.scss';
import styles from '../../EventFilter/styles.module.scss';

// const PATROL_STATUS_CHOICES = [
//   { value: 'cancelled', label: 'Cancelled' },
//   { value: 'overdue', label: 'Overdue' },
//   { value: 'done', label: 'Done' },
//   { value: 'active', label: 'Active' },
//   { value: 'scheduled', label: 'Scheduled' },
// ];

// eslint-disable-next-line react/display-name
const FiltersPopover = React.forwardRef(({
  onTrackedByChange,
  // onStateSelect,
  patrolLeaders,
  resetFilters,
  resetTrackedByFilter,
  // resetStateFilter,
  selectedLeaders,
  showResetFiltersButton,
  showResetTrackedByButton,
  // status,
  // stateFilterModified,
  ...rest
}, ref) => <Popover
    {...rest}
    ref={ref}
    className={`${styles.filterPopover} ${styles.filters} ${patrolFilterStyles.popover}`}
    id='filter-popover'
  >
  <Popover.Title>
    <div className={styles.popoverTitle}>
      Patrol Filters
      {showResetFiltersButton &&
        <Button
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
    <div className={`${styles.filterRow} ${patrolFilterStyles.trackedByContainer}`}>
      <label>TRACKED BY</label>
      <div className="select">
        <ReportedBySelect
          className={styles.reportedBySelect}
          isMulti
          onChange={onTrackedByChange}
          options={patrolLeaders}
          placeholder='Select Device...'
          value={selectedLeaders}
        />
        <Button
          className={!showResetTrackedByButton && 'hidden'}
          onClick={resetTrackedByFilter}
          size='sm'
          type="button"
          variant='light'
        >
          Reset
        </Button>
      </div>
    </div>

    {/*<div className={styles.filterRow}>
      <label>Status</label>
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
    </div>

    <div className={styles.filterRow}>
      <label>Patrol Type</label>
    </div>*/}
  </Popover.Content>
</Popover>);

FiltersPopover.propTypes = {
  patrolLeaders: [],
  resetFilters: null,
  resetTrackedByFilter: null,
  showResetFiltersButton: true,
  showResetTrackedByButton: true,
};

FiltersPopover.propTypes = {
  onTrackedByChange: PropTypes.func.isRequired,
  // onStateSelect,
  patrolLeaders: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string })),
  resetFilters: PropTypes.func,
  resetTrackedByFilter: PropTypes.func,
  // resetStateFilter,
  selectedLeaders: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string })
  ).isRequired,
  showResetFiltersButton: PropTypes.bool,
  showResetTrackedByButton: PropTypes.bool,
  // status,
  // stateFilterModified,
};

export default FiltersPopover;
