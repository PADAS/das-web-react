import React, { memo, useState, useEffect, useRef, useMemo } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';
import intersection from 'lodash/intersection';
import uniq from 'lodash/uniq';
import noop from 'lodash/noop';

import { EVENT_STATE_CHOICES } from '../constants';
import { updateEventFilter, INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { DEFAULT_EVENT_SORT } from '../utils/event-filter';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { trackEvent } from '../utils/analytics';
import { caseInsensitiveCompare } from '../utils/string';

import { reportedBy } from '../selectors';

import EventFilterDateRangeSelector from './DateRange';
import ReportTypeMultiSelect from '../ReportTypeMultiSelect';
import PriorityPicker from '../PriorityPicker';
import ReportedBySelect from '../ReportedBySelect';
import CheckMark from '../Checkmark';
import SearchBar from '../SearchBar';
import FriendlyEventFilterString from '../EventFilter/FriendlyEventFilterString';
import { ReactComponent as FilterIcon } from '../common/images/icons/filter-icon.svg';
import { ReactComponent as UserIcon } from '../common/images/icons/user-profile.svg';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';
import { ReactComponent as RefreshIcon } from '../common/images/icons/refresh-icon.svg';

import { debouncedTrackEvent } from '../utils/analytics';

import styles from './styles.module.scss';

const debouncedAnalytics = debouncedTrackEvent();

const EventFilter = (props) => {
  const { children, className, eventFilter, eventTypes, feedEvents, reporters, resetGlobalDateRange, updateEventFilter, sortConfig = DEFAULT_EVENT_SORT, onResetAll = noop } = props;
  const { state, filter: { date_range, event_type: currentFilterReportTypes, priority, reported_by, text } } = eventFilter;

  const eventTypeIDs = eventTypes.map(type => type.id);

  const eventTypeFilterEmpty = !currentFilterReportTypes.length;

  const [filterText, setFilterText] = useState(eventFilter.filter.text);
  const [reportTypeFilterText, setReportTypeFilterText] = useState('');

  const reportTypesCheckedCount = intersection(eventTypeIDs, currentFilterReportTypes).length;
  const someReportTypesChecked = !eventTypeFilterEmpty && !!reportTypesCheckedCount;
  const noReportTypesChecked = !eventTypeFilterEmpty && !someReportTypesChecked;

  const isSortModified = !isEqual(DEFAULT_EVENT_SORT, sortConfig);
  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range);
  const stateFilterModified = !isEqual(INITIAL_FILTER_STATE.state, state);
  const priorityFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.priority, priority);
  const reportedByFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.reported_by, reported_by);

  const filterModified = priorityFilterModified || !eventTypeFilterEmpty || stateFilterModified || reportedByFilterModified;

  const hasChildrenComponents = useMemo(() => !!React.Children.count(children), [children]);

  const selectedReporters = eventFilter.filter.reported_by && !!eventFilter.filter.reported_by.length ?
    eventFilter.filter.reported_by
      .map(id =>
        reporters.find(r => r.id === id)
      ).filter(item => !!item)
    : [];

  const toggleAllReportTypes = (e) => {
    e.stopPropagation();
    if (eventTypeFilterEmpty) {
      trackEvent('Event Filter', 'Uncheck All Event Types Filter');
      updateEventFilter({ filter: { event_type: [null] } });
    } else {
      trackEvent('Event Filter', 'Check All Event Types Filter');
      updateEventFilter({ filter: { event_type: [] } });
    }
  };

  const resetReportTypes = (_e) => {
    trackEvent('Event Filter', 'Reset Event Types Filter');
    setReportTypeFilterText('');
    updateEventFilter({ filter: { event_type: [] } });
  };

  const onReportCategoryToggle = ({ value }) => {
    const toToggle = eventTypes.filter(({ category: { value: v } }) => v === value).map(({ id }) => id);
    const allShown = eventTypeFilterEmpty
      ? true
      : (intersection(currentFilterReportTypes, toToggle).length === toToggle.length);
    if (allShown) {
      trackEvent('Event Filter', 'Uncheck Event Type Category Filter');
      updateEventFilter({ filter: { event_type: (eventTypeFilterEmpty ? eventTypeIDs : currentFilterReportTypes).filter(id => !toToggle.includes(id)) } });
    } else {
      trackEvent('Event Filter', 'Uncheck Event Type Category Filter');
      const updatedValue = uniq([...currentFilterReportTypes, ...toToggle]);

      updateEventFilter({ filter: { event_type: updatedValue.length === eventTypeIDs.length ? [] : updatedValue } });
    }
  };

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

  const onPriorityChange = (value) => {
    const newVal = priority.includes(value)
      ? priority.filter(item => item !== value)
      : [...priority, value];


    trackEvent('Event Filter', 'Set Priority Filter', newVal.toString());

    updateEventFilter({
      filter: {
        priority: newVal,
      },
    });
  };

  const onReportTypeToggle = ({ id }) => {
    const visible = eventTypeFilterEmpty ? true : currentFilterReportTypes.includes(id);
    if (visible) {
      trackEvent('Event Filter', 'Uncheck Event Type Filter');
      updateEventFilter({ filter: { event_type: (eventTypeFilterEmpty ? eventTypeIDs : currentFilterReportTypes).filter(item => item !== id) } });
    } else {
      trackEvent('Event Filter', 'Check Event Type Filter');
      const updatedValue = [...currentFilterReportTypes, id];
      updateEventFilter({ filter: { event_type: updatedValue.length === eventTypeIDs.length ? [] : updatedValue } });
    }
  };

  const onFilteredReportsSelect = (types) => {
    updateEventFilter({ filter: { event_type: types.map(({ id }) => id) } });
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
    setReportTypeFilterText('');
    trackEvent('Event Filter', 'Click Reset All Filters');
  };

  const clearDateRange = (e) => {
    if (e) e.stopPropagation();
    resetGlobalDateRange();
    trackEvent('Event Filter', 'Click Reset Date Range Filter');
  };

  const resetAllFilters = () => {
    if (filterModified) resetPopoverFilters();
    if (dateRangeModified) clearDateRange();
    onResetAll();
  };

  const resetStateFilter = (e) => {
    e.stopPropagation();
    updateEventFilter({ state: INITIAL_FILTER_STATE.state });
    trackEvent('Event Filter', 'Click Reset State Filter');
  };

  const resetPriorityFilter = (e) => {
    e.stopPropagation();
    updateEventFilter({ filter: { priority: INITIAL_FILTER_STATE.filter.priority } });
    trackEvent('Event Filter', 'Click Reset Priority Filter');
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
    debouncedAnalytics('Event Filter', 'Clear Search Text Filter');
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

  // useEffect(() => {
  //   const childrenComponentsCount = React.Children.count(children);
  //   // does the prop children has something to render? this can affect the style
  //   if (hasChildrenComponents !== childrenComponentsCount) {
  //     setChildrenComponentsStatus(childrenComponentsCount);
  //   }
  // }, [children, hasChildrenComponents]);

  const FilterDatePopover = <Popover className={styles.filterPopover} id='filter-date-popover' data-testid='filter-date-popover'>
    <Popover.Title>
      <div className={styles.popoverTitle}>
        <ClockIcon />Date Range
        <Button type="button" variant='light' size='sm'
          onClick={clearDateRange} disabled={!dateRangeModified}>Reset</Button>
      </div>
    </Popover.Title>
    <Popover.Content>
      <EventFilterDateRangeSelector placement='bottom' endDateLabel='' startDateLabel=''/>
    </Popover.Content>
  </Popover>;

  const FilterPopover = <Popover className={`${styles.filterPopover} ${styles.filters}`} id='filter-popover' data-testid='filter-popover'>
    <Popover.Title>
      <div className={styles.popoverTitle}>
        Report Filters
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
      <div className={`${styles.filterRow} ${styles.priorityRow}`}>
        <label>Priority</label>
        <PriorityPicker className={styles.priorityPicker} onSelect={onPriorityChange} selected={priority} isMulti={true} />
        <Button type="button" variant='light' size='sm' disabled={!priorityFilterModified} onClick={resetPriorityFilter}>Reset</Button>
      </div>
      <div className={styles.filterRow}>
        <UserIcon />
        <ReportedBySelect className={styles.reportedBySelect} value={selectedReporters} onChange={onReportedByChange} isMulti={true} />
        <Button type="button" variant='light' size='sm' disabled={!reportedByFilterModified} onClick={resetReportedByFilter}>Reset</Button>
      </div>
      <div className={`${styles.filterRow} ${styles.reportTypeRow}`}>
        <h5 className={`${styles.filterTitle} ${styles.reportFilterTitle}`}>
          <div className={styles.toggleAllReportTypes}>
            <CheckMark fullyChecked={!noReportTypesChecked && !someReportTypesChecked} partiallyChecked={!noReportTypesChecked && someReportTypesChecked} onClick={toggleAllReportTypes} />
            <span>All</span>
          </div>
          Report Types
          <small className={!eventTypeFilterEmpty ? styles.modified : ''}>
            {eventTypeFilterEmpty && 'All selected'}
            {someReportTypesChecked && `${reportTypesCheckedCount} of ${eventTypeIDs.length} selected`}
            {noReportTypesChecked && 'None selected'}
          </small>
          <Button type="button" variant='light' size='sm' disabled={eventTypeFilterEmpty} onClick={resetReportTypes}>Reset</Button>
        </h5>
        <ReportTypeMultiSelect filter={reportTypeFilterText} onFilterChange={setReportTypeFilterText} selectedReportTypeIDs={currentFilterReportTypes} onCategoryToggle={onReportCategoryToggle} onFilteredItemsSelect={onFilteredReportsSelect} onTypeToggle={onReportTypeToggle} />
      </div>
    </Popover.Content>
  </Popover>;

  return <>
    <form className={`${styles.form} ${className}`} onSubmit={e => e.preventDefault()}>
      <div className={styles.controls}>
        <SearchBar className={`${styles.search} ${!hasChildrenComponents ? styles.wider : ''}`} placeholder='Search Reports...' value={filterText} onChange={onSearchChange} onClear={onSearchClear} />
        <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={FilterPopover} flip={true}>
          <Button variant={filterModified ? 'primary' : 'light'} size='sm' className={styles.popoverTrigger} data-testid='filter-btn'>
            <FilterIcon className={styles.filterIcon} onClick={onEventFilterIconClicked} /> <span>Filters</span>
          </Button>
        </OverlayTrigger>
        <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={FilterDatePopover} flip={true}>
          <Button variant={dateRangeModified ? 'primary' : 'light'} size='sm' className={styles.popoverTrigger} data-testid='date-filter-btn'>
            <ClockIcon className={styles.clockIcon} onClick={onDateFilterIconClicked}/>
            <span>Dates</span>
          </Button>
        </OverlayTrigger>
        {children}
      </div>
    </form>
    <div className={`${styles.filterStringWrapper} ${className}`} data-testid='general-reset-wrapper'>
      <FriendlyEventFilterString className={styles.friendlyFilterString} sortConfig={sortConfig} totalFeedEventCount={feedEvents.count} />
      {(filterModified || dateRangeModified || isSortModified) && <Button type="button" variant='light' size='sm' onClick={resetAllFilters} data-testid='general-reset-btn'><RefreshIcon /> Reset</Button>}
    </div>
  </>;
};

const mapStateToProps = (state) =>
  ({
    eventFilter: state.data.eventFilter,
    eventTypes: state.data.eventTypes,
    feedEvents: state.data.feedEvents,
    reporters: reportedBy(state),
  });

export default connect(mapStateToProps, { updateEventFilter, resetGlobalDateRange })(memo(EventFilter));
