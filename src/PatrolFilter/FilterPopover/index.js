import React from 'react';
import Button from 'react-bootstrap/Button';
import isEqual from 'react-fast-compare';
import Popover from 'react-bootstrap/Popover';

import { ReactComponent as UserIcon } from '../../common/images/icons/user-profile.svg';
import ReportedBySelect from '../../ReportedBySelect';

import styles from '../../EventFilter/styles.module.scss';

const PATROL_STATUS_CHOICES = [
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'done', label: 'Done' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
];

const FilterPopover = ({
  containerRef,
  filterModified,
  onReportedByChange,
  onStateSelect,
  reportedByFilterModified,
  resetPopoverFilters,
  resetReportedByFilter,
  resetStateFilter,
  selectedReporters,
  status,
  stateFilterModified,
  ...rest
}, ref) => (
  <Popover {...rest} ref={ref} className={`${styles.filterPopover} ${styles.filters}`} id='filter-popover'>
    <Popover.Title>
      <div className={styles.popoverTitle}>
        Patrol Filters
        <Button
          type="button"
          variant='light'
          size='sm'
          onClick={resetPopoverFilters}
          disabled={!filterModified}
        >
          Reset all
        </Button>
      </div>
    </Popover.Title>

    <Popover.Content>
      <div className={styles.filterRow}>
        <label>State</label>
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
        <Button type="button" variant='light' size='sm' disabled={!stateFilterModified} onClick={resetStateFilter}>Reset</Button>
      </div>

      <div className={styles.filterRow}>
        <UserIcon />Team
        <ReportedBySelect menuRef={containerRef.current} className={styles.reportedBySelect} value={selectedReporters} onChange={onReportedByChange} isMulti={true} />
        <Button type="button" variant='light' size='sm' disabled={!reportedByFilterModified} onClick={resetReportedByFilter}>Reset</Button>
      </div>
    </Popover.Content>
  </Popover>
);

export default React.forwardRef(FilterPopover);
