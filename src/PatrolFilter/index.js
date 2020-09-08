import React, { memo, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';
import uniq from 'lodash/uniq';

import { EVENT_STATE_CHOICES } from '../constants';
import { updateEventFilter, INITIAL_FILTER_STATE } from '../ducks/event-filter';
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

const EventFilter = (props) => {
  const { children, className, eventFilter, reporters, updateEventFilter } = props;
  const { state, filter: { date_range, event_type: currentFilterReportTypes, priority, reported_by, text } } = eventFilter;

  const eventTypeFilterEmpty = !currentFilterReportTypes.length;

  const menuContainerRef = useRef(null);

  const [filterText, setFilterText] = useState(eventFilter.filter.text);

  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range);
  const stateFilterModified = !isEqual(INITIAL_FILTER_STATE.state, state);
  const priorityFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.priority, priority);
  const reportedByFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.reported_by, reported_by);

  const filterModified = priorityFilterModified || !eventTypeFilterEmpty || stateFilterModified || reportedByFilterModified;

  const selectedReporters = eventFilter.filter.reported_by && !!eventFilter.filter.reported_by.length ?

    eventFilter.filter.reported_by
      .map(id =>
        reporters.find(r => r.id === id)
      ).filter(item => !!item)
    : [];

  const onReportedByChange = (values) => {
    const hasValue = values && !!values.length;
    
    if (hasValue) {
      updateEventFilter({
        filter: {
          reported_by: uniq(values.map(({ id }) => id)),
        }
      });
    } else {
      updateEventFilter({
        filter: {
          reported_by: [],
        }
      });
    }
    trackEvent('Event Filter', `${hasValue ? 'Set' : 'Clear'} 'Reported By' Filter`, hasValue ? `${values.length} reporters` : null);
  };

  const updateEventFilterDebounced = useRef(debounce(function (update) {
    updateEventFilter(update);
  }, 200));
  

  const onStateSelect = ({ value }) => {
    updateEventFilter({ state: value });
    trackEvent('Event Filter', `Select '${value}' State Filter`);
  };

  const resetPopoverFilters = () => {
    updateEventFilter({
      state: INITIAL_FILTER_STATE.state,
      filter: {
        event_type: INITIAL_FILTER_STATE.filter.event_type,
        priority: INITIAL_FILTER_STATE.filter.priority,
        reported_by: INITIAL_FILTER_STATE.filter.reported_by,
      },
    });
    trackEvent('Event Filter', 'Click Reset All Filters');
  };

  const clearDateRange = (e) => {
    e.stopPropagation();
    updateEventFilter({
      filter: {
        date_range: INITIAL_FILTER_STATE.filter.date_range,
      },
    });
    trackEvent('Event Filter', 'Click Reset Date Range Filter');
  };

  const resetStateFilter = (e) => {
    e.stopPropagation();
    updateEventFilter({ state: INITIAL_FILTER_STATE.state });
    trackEvent('Event Filter', 'Click Reset State Filter');
  };

  const resetReportedByFilter = (e) => {
    e.stopPropagation();
    updateEventFilter({ filter: { reported_by: INITIAL_FILTER_STATE.filter.reported_by } });
    trackEvent('Event Filter', 'Click Reset Reported By Filter');
  };

  const StateSelector = () => <ul className={styles.stateList}>
    {EVENT_STATE_CHOICES.map(choice =>
      <li className={isEqual(choice.value, state) ? styles.activeState : ''}
        key={choice.value} onClick={() => onStateSelect(choice)}>
        <Button variant='link'>
          {choice.label}
        </Button>
      </li>)}
  </ul>;

  const onDateFilterIconClicked = (e) => {
    trackEvent('Reports', 'Dates Icon Clicked');
  };

  const onEventFilterIconClicked = (e) => {
    trackEvent('Reports', 'Filters Icon Clicked');
  };

  const onSearchChange = ({ target: { value } }) => {
    setFilterText(value);
    trackEvent('Event Filter', 'Change Search Text Filter');
  };

  const onSearchClear = (e) => {
    e.stopPropagation();
    setFilterText('');
    trackEvent('Event Filter', 'Clear Search Text Filter');
  };

  useEffect(() => {
    if (!caseInsensitiveCompare(filterText, text)) {
      if (!!filterText.length) {
        updateEventFilterDebounced.current({
          filter: { text: filterText },
        });
      } else {
        updateEventFilter({
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
        <ReportedBySelect menuRef={menuContainerRef ? menuContainerRef : null} className={styles.reportedBySelect} value={selectedReporters} onChange={onReportedByChange} isMulti={true} />
        <Button type="button" variant='light' size='sm' disabled={!reportedByFilterModified} onClick={resetReportedByFilter}>Reset</Button>
      </div>
    </Popover.Content>
  </Popover>;

  console.log('menuContainerRef', menuContainerRef);

  return <form className={`${styles.form} ${className}`} onSubmit={e => e.preventDefault()}>
    <div className={styles.controls}  ref={menuContainerRef}>
      <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={FilterPopover} flip={true}>
        <span className={`${styles.popoverTrigger} ${filterModified ? styles.modified : ''}`}>
          <FilterIcon className={styles.filterIcon} onClick={onEventFilterIconClicked} />
          <span>Filter Patrols</span>
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
    eventFilter: state.data.eventFilter,
    eventTypes: state.data.eventTypes,
    reporters: reportedBy(state),
  });

export default connect(mapStateToProps, { updateEventFilter })(memo(EventFilter));
