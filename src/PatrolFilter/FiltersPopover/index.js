import React from 'react';
import Button from 'react-bootstrap/Button';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import CheckboxList from '../../CheckboxList';
import ReportedBySelect from '../../ReportedBySelect';

import patrolFiltersPopoverStyles from './styles.module.scss';
import styles from '../../EventFilter/styles.module.scss';

const FiltersPopover = React.forwardRef(({
  onLeadersFilterChange,
  onPatrolTypesFilterChange,
  onStatusFilterChange,
  leaderFilterOptions = [],
  patrolTypeFilterOptions = [],
  statusFilterOptions = [],
  resetFilters = null,
  resetLeadersFilter = null,
  resetPatrolTypesFilter = null,
  resetStatusFilter = null,
  selectedLeaders = [],
  showResetFiltersButton = false,
  showResetLeadersFilterButton = false,
  showResetPatrolTypesFilterButton = false,
  showResetStatusFilterButton = false,
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
          options={leaderFilterOptions}
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

    <div className={`${styles.filterRow} ${patrolFiltersPopoverStyles.statusContainer}`}>
      <div className='header'>
        <label>Status</label>
        <Button
          className={!showResetStatusFilterButton && 'hidden'}
          onClick={resetStatusFilter}
          size='sm'
          type="button"
          variant='light'
        >
          Reset
        </Button>
      </div>
      <CheckboxList items={statusFilterOptions} onItemClick={onStatusFilterChange} />
    </div>

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
      <CheckboxList items={patrolTypeFilterOptions} onItemClick={onPatrolTypesFilterChange} />
    </div>
  </Popover.Content>
</Popover>);

FiltersPopover.propTypes = {
  onLeadersFilterChange: PropTypes.func.isRequired,
  onPatrolTypesFilterChange: PropTypes.func.isRequired,
  onStatusFilterChange: PropTypes.func.isRequired,
  leaderFilterOptions: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string })),
  patrolTypeFilterOptions: PropTypes.arrayOf(PropTypes.shape({
    checked: PropTypes.bool,
    id: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  })),
  statusFilterOptions: PropTypes.arrayOf(PropTypes.shape({
    checked: PropTypes.bool,
    id: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  })),
  resetFilters: PropTypes.func,
  resetLeadersFilter: PropTypes.func,
  resetPatrolTypesFilter: PropTypes.func,
  resetStatusFilter: PropTypes.func,
  selectedLeaders: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string })),
  showResetFiltersButton: PropTypes.bool,
  showResetLeadersFilterButton: PropTypes.bool,
  showResetPatrolTypesFilterButton: PropTypes.bool,
  showResetStatusFilterButton: PropTypes.bool,
};

FiltersPopover.displayName = 'FiltersPopover';

export default FiltersPopover;
