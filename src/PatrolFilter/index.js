import React, { memo, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';
import uniq from 'lodash/uniq';

import { updatePatrolFilter, INITIAL_FILTER_STATE } from '../ducks/patrol-filter';
import { trackEvent } from '../utils/analytics';
import { caseInsensitiveCompare } from '../utils/string';

import { reportedBy } from '../selectors';

import EventFilterDateRangeSelector from '../EventFilter/DateRange';
import ReportedBySelect from '../ReportedBySelect';
import SearchBar from '../SearchBar';
import { ReactComponent as FilterIcon } from '../common/images/icons/filter-icon.svg';
import { ReactComponent as UserIcon } from '../common/images/icons/user-profile.svg';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from '../EventFilter/styles.module.scss';

const PATROL_STATUS_CHOICES = [
  { value: 'cancelled', 
    label: 'Cancelled',
  },
  { value: 'overdue', 
    label: 'Overdue',
  },
  { value: 'done', 
    label: 'Done',
  },
  { value: 'active', 
    label: 'Active',
  },
  { value: 'scheduled', 
    label: 'Scheduled',
  },
      
];

const PatrolFilter = (props) => {
  const { children, className, patrolFilter, reporters, updatePatrolFilter } = props;
  const { status, filter: { date_range, patrol_type: currentFilterReportTypes, leader, text } } = patrolFilter;

  const patrolTypeFilterEmpty = currentFilterReportTypes && !currentFilterReportTypes.length;

  const menuContainerRef = useRef(null);

  const [filterText, setFilterText] = useState(patrolFilter.filter.text);

  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range);
  const stateFilterModified = !isEqual(INITIAL_FILTER_STATE.status, status);
  const reportedByFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.leader, leader);

  const filterModified = !patrolTypeFilterEmpty || stateFilterModified || reportedByFilterModified;

  const selectedReporters = patrolFilter.filter.leader && !!patrolFilter.filter.leader.length ?

    patrolFilter.filter.leader
      .map(id =>
        reporters.find(r => r.id === id)
      ).filter(item => !!item)
    : [];

  const onReportedByChange = (values) => {
    const hasValue = values && !!values.length;
    
    if (hasValue) {
      updatePatrolFilter({
        filter: {
          leader: uniq(values.map(({ id }) => id)),
        }
      });
    } else {
      updatePatrolFilter({
        filter: {
          leader: [],
        }
      });
    }
    trackEvent('Patrol Filter', `${hasValue ? 'Set' : 'Clear'} 'Reported By' Filter`, hasValue ? `${values.length} reporters` : null);
  };

  const updatePatrolFilterDebounced = useRef(debounce(function (update) {
    updatePatrolFilter(update);
  }, 200));
  

  const onStateSelect = ({ value }) => {
    updatePatrolFilter({ status: value });
    trackEvent('Patrol Filter', `Select '${value}' State Filter`);
  };

  const resetPopoverFilters = () => {
    updatePatrolFilter({
      status: INITIAL_FILTER_STATE.status,
      filter: {
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
        leader: INITIAL_FILTER_STATE.filter.leader,
      },
    });
    trackEvent('Patrol Filter', 'Click Reset All Filters');
  };

  const clearDateRange = (e) => {
    e.stopPropagation();
    updatePatrolFilter({
      filter: {
        date_range: INITIAL_FILTER_STATE.filter.date_range,
      },
    });
    trackEvent('Patrol Filter', 'Click Reset Date Range Filter');
  };

  const resetStateFilter = (e) => {
    e.stopPropagation();
    updatePatrolFilter({ status: INITIAL_FILTER_STATE.status });
    trackEvent('Patrol Filter', 'Click Reset State Filter');
  };

  const resetReportedByFilter = (e) => {
    e.stopPropagation();
    updatePatrolFilter({ filter: { leader: INITIAL_FILTER_STATE.filter.leader } });
    trackEvent('Patrol Filter', 'Click Reset Reported By Filter');
  };

  const StateSelector = () => <ul className={styles.stateList}>
    {PATROL_STATUS_CHOICES.map(choice =>
      <li className={isEqual(choice.value, status) ? styles.activeState : ''}
        key={choice.value} onClick={() => onStateSelect(choice)}>
        <Button variant='link'>
          {choice.label}
        </Button>
      </li>)}
  </ul>;

  const onDateFilterIconClicked = (e) => {
    trackEvent('Reports', 'Dates Icon Clicked');
  };

  const onPatrolFilterIconClicked = (e) => {
    trackEvent('Reports', 'Filters Icon Clicked');
  };

  const onSearchChange = ({ target: { value } }) => {
    setFilterText(value);
    trackEvent('Patrol Filter', 'Change Search Text Filter');
  };

  const onSearchClear = (e) => {
    e.stopPropagation();
    setFilterText('');
    trackEvent('Patrol Filter', 'Clear Search Text Filter');
  };

  useEffect(() => {
    if (filterText && !caseInsensitiveCompare(filterText, text)) {
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
    if (filterText && !caseInsensitiveCompare(filterText, text)) {
      setFilterText(text);
    }
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const FilterDatePopover = <Popover className={styles.filterPopover} id='filter-date-popover'>
    <Popover.Title>
      <div className={styles.popoverTitle}>
        <ClockIcon />Patrol Date Range
        <Button type="button" variant='light' size='sm'
          onClick={clearDateRange} disabled={!dateRangeModified}>Reset</Button>
      </div>
    </Popover.Title>
    <Popover.Content>
      <EventFilterDateRangeSelector placement='bottom' endDateLabel='' startDateLabel=''/>
    </Popover.Content>
  </Popover>;

  const FilterPopover = <Popover className={`${styles.filterPopover} ${styles.filters}`} id='filter-popover'>
    <Popover.Title>
      <div className={styles.popoverTitle}>
        Patrol Filters
        <Button type="button" variant='light' size='sm'
          onClick={resetPopoverFilters} disabled={!filterModified}>Reset all</Button>
      </div>
    </Popover.Title>
    <Popover.Content>
      <div className={styles.filterRow}>
        {/* state here */}
        <label>State</label>
        <StateSelector />
        <Button type="button" variant='light' size='sm' disabled={!stateFilterModified} onClick={resetStateFilter}>Reset</Button>
      </div>
      <div className={styles.filterRow}>
        <UserIcon />Team
        <ReportedBySelect menuRef={menuContainerRef.current} className={styles.reportedBySelect} value={selectedReporters} onChange={onReportedByChange} isMulti={true} />
        <Button type="button" variant='light' size='sm' disabled={!reportedByFilterModified} onClick={resetReportedByFilter}>Reset</Button>
      </div>
    </Popover.Content>
  </Popover>;

  return <form className={`${styles.form} ${className}`} onSubmit={e => e.preventDefault()}>
    <div className={styles.controls}  ref={menuContainerRef}>
      <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={FilterPopover} flip={true}>
        <span className={`${styles.popoverTrigger} ${filterModified ? styles.modified : ''}`}>
          <FilterIcon className={styles.filterIcon} onClick={onPatrolFilterIconClicked} />
          <span>Filter</span>
        </span>
      </OverlayTrigger>
      <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={FilterDatePopover} flip={true}>
        <span className={`${styles.popoverTrigger} ${dateRangeModified ? styles.modified : ''}`}>
          <ClockIcon className={styles.clockIcon} onClick={onDateFilterIconClicked}/>
          <span>Dates</span>
        </span>
      </OverlayTrigger>
      <SearchBar className={styles.search} placeholder='Search Patrols...' value={filterText}
        onChange={onSearchChange} onClear={onSearchClear} />
      {children}
    </div>
    {/* <FriendlyEventFilterString className={styles.filterDetails} /> */}
  </form>;
};

const mapStateToProps = (state) =>
  ({
    patrolFilter: state.data.patrolFilter,
    patrolTypes: state.data.patrolTypes,
    reporters: reportedBy(state),
  });

export default connect(mapStateToProps, { updatePatrolFilter })(memo(PatrolFilter));
