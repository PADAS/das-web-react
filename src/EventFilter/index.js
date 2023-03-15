import React, { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';
import intersection from 'lodash/intersection';
import uniq from 'lodash/uniq';
import noop from 'lodash/noop';

import { BREAKPOINTS, EVENT_STATE_CHOICES } from '../constants';
import { updateEventFilter, INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { DEFAULT_EVENT_SORT, isFilterModified } from '../utils/event-filter';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { trackEventFactory, EVENT_FILTER_CATEGORY, REPORTS_CATEGORY } from '../utils/analytics';
import { caseInsensitiveCompare } from '../utils/string';
import { useMatchMedia } from '../hooks';

import { reportedBy } from '../selectors';

import EventFilterDateRangeSelector from './DateRange';
import ReportTypeMultiSelect from '../ReportTypeMultiSelect';
import PriorityPicker from '../PriorityPicker';
import ReportedBySelect from '../ReportedBySelect';
import CheckMark from '../Checkmark';
import SearchBar from '../SearchBar';
import FriendlyFilterString from '../FriendlyFilterString';
import { ReactComponent as FilterIcon } from '../common/images/icons/filter-icon.svg';
import { ReactComponent as UserIcon } from '../common/images/icons/user-profile.svg';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';
import { ReactComponent as RefreshIcon } from '../common/images/icons/refresh-icon.svg';
import styles from './styles.module.scss';

const eventFilterTracker = trackEventFactory(EVENT_FILTER_CATEGORY);
const reportsTracker = trackEventFactory(REPORTS_CATEGORY);

const EventFilter = ({ children, className, eventFilter, eventTypes, feedEvents, reporters, resetGlobalDateRange, updateEventFilter, sortConfig = DEFAULT_EVENT_SORT, onResetAll = noop }) => {
  const { state, filter: { date_range, event_type: currentFilterReportTypes, priority, reported_by, text } } = eventFilter;

  const eventTypeIDs = useMemo(() => eventTypes.map(type => type.id), [eventTypes]);

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

  const selectedReporters = useMemo(() => {
    return eventFilter.filter.reported_by && !!eventFilter.filter.reported_by.length ?
      eventFilter.filter.reported_by
        .map(id =>
          reporters.find(r => r.id === id)
        ).filter(item => !!item)
      : [];
  }, [reporters, eventFilter.filter.reported_by]);

  const isLargeLayout = useMatchMedia(BREAKPOINTS.screenIsLargeLayoutOrLarger);

  const toggleAllReportTypes = useCallback((e) => {
    e.stopPropagation();
    if (eventTypeFilterEmpty) {
      eventFilterTracker.track('Uncheck All Event Types Filter');
      updateEventFilter({ filter: { event_type: [null] } });
    } else {
      eventFilterTracker.track('Check All Event Types Filter');
      updateEventFilter({ filter: { event_type: [] } });
    }
  }, [eventTypeFilterEmpty, updateEventFilter]);

  const resetReportTypes = useCallback((_e) => {
    eventFilterTracker.track('Reset Event Types Filter');
    setReportTypeFilterText('');
    updateEventFilter({ filter: { event_type: [] } });
  }, [updateEventFilter]);

  const onReportCategoryToggle = useCallback(({ value }) => {
    const toToggle = eventTypes.filter(({ category: { value: v } }) => v === value).map(({ id }) => id);
    const allShown = eventTypeFilterEmpty
      ? true
      : (intersection(currentFilterReportTypes, toToggle).length === toToggle.length);
    if (allShown) {
      eventFilterTracker.track('Uncheck Event Type Category Filter');
      updateEventFilter({ filter: { event_type: (eventTypeFilterEmpty ? eventTypeIDs : currentFilterReportTypes).filter(id => !toToggle.includes(id)) } });
    } else {
      eventFilterTracker.track('Uncheck Event Type Category Filter');
      const updatedValue = uniq([...currentFilterReportTypes, ...toToggle]);

      updateEventFilter({ filter: { event_type: updatedValue.length === eventTypeIDs.length ? [] : updatedValue } });
    }
  }, [currentFilterReportTypes, eventTypeFilterEmpty, eventTypeIDs, eventTypes, updateEventFilter]);

  const onReportedByChange = useCallback((values) => {
    const hasValue = values && !!values.length;
    updateEventFilter({
      filter: {
        reported_by: hasValue ? uniq(values.map(({ id }) => id)) : [],
      }
    });
    eventFilterTracker.track(`${hasValue ? 'Set' : 'Clear'} 'Reported By' Filter`, hasValue ? `${values.length} reporters` : null);
  }, [updateEventFilter]);

  const onPriorityChange = useCallback((value) => {
    const newVal = priority.includes(value)
      ? priority.filter(item => item !== value)
      : [...priority, value];
    updateEventFilter({
      filter: {
        priority: newVal,
      },
    });
    eventFilterTracker.track('Set Priority Filter', newVal.toString());
  }, [priority, updateEventFilter]);

  const onReportTypeToggle = useCallback(({ id }) => {
    const visible = eventTypeFilterEmpty ? true : currentFilterReportTypes.includes(id);
    if (visible) {
      eventFilterTracker.track('Uncheck Event Type Filter');
      updateEventFilter({ filter: { event_type: (eventTypeFilterEmpty ? eventTypeIDs : currentFilterReportTypes).filter(item => item !== id) } });
    } else {
      eventFilterTracker.track('Check Event Type Filter');
      const updatedValue = [...currentFilterReportTypes, id];
      updateEventFilter({ filter: { event_type: updatedValue.length === eventTypeIDs.length ? [] : updatedValue } });
    }
  }, [currentFilterReportTypes, eventTypeFilterEmpty, eventTypeIDs, updateEventFilter]);

  const onFilteredReportsSelect = useCallback((types) => {
    updateEventFilter({ filter: { event_type: types.map(({ id }) => id) } });
  }, [updateEventFilter]);

  const updateEventFilterDebounced = useRef(debounce(function (update) {
    updateEventFilter(update);
  }, 200));

  const onStateSelect = useCallback(({ value }) => {
    if (!isEqual(state, value)){
      updateEventFilter({ state: value });
      eventFilterTracker.track(`Select '${value}' State Filter`);
    }
  }, [state, updateEventFilter]);

  const resetPopoverFilters = useCallback(() => {
    updateEventFilter({
      state: INITIAL_FILTER_STATE.state,
      filter: {
        event_type: INITIAL_FILTER_STATE.filter.event_type,
        priority: INITIAL_FILTER_STATE.filter.priority,
        reported_by: INITIAL_FILTER_STATE.filter.reported_by,
      },
    });
    setReportTypeFilterText('');
    eventFilterTracker.track('Click Reset All Filters');
  }, [updateEventFilter]);

  const clearDateRange = useCallback((e) => {
    if (e) e.stopPropagation();
    resetGlobalDateRange();
    eventFilterTracker.track('Click Reset Date Range Filter');
  }, [resetGlobalDateRange]);

  const onSearchClear = useCallback((e) => {
    e?.stopPropagation();
    setFilterText('');
    eventFilterTracker.track('Clear Search Text Filter');
  }, []);

  const resetAllFilters = useCallback(() => {
    if (filterModified) resetPopoverFilters();
    if (dateRangeModified) clearDateRange();
    if (filterText) onSearchClear();
    onResetAll();
  }, [clearDateRange, dateRangeModified, filterModified, filterText, onResetAll, onSearchClear, resetPopoverFilters]);

  const resetStateFilter = useCallback((e) => {
    e.stopPropagation();
    updateEventFilter({ state: INITIAL_FILTER_STATE.state });
    eventFilterTracker.track('Click Reset State Filter');
  }, [updateEventFilter]);

  const resetPriorityFilter = useCallback((e) => {
    e.stopPropagation();
    updateEventFilter({ filter: { priority: INITIAL_FILTER_STATE.filter.priority } });
    eventFilterTracker.track('Click Reset Priority Filter');
  }, [updateEventFilter]);

  const resetReportedByFilter = useCallback((e) => {
    e.stopPropagation();
    updateEventFilter({ filter: { reported_by: INITIAL_FILTER_STATE.filter.reported_by } });
    eventFilterTracker.track('Click Reset Reported By Filter');
  }, [updateEventFilter]);

  const StateSelector = useCallback(() => (
    <ul className={styles.stateList} data-testid="state-filter-options">
      {EVENT_STATE_CHOICES.map(choice =>
        <li key={choice.value}>
          <Button
              variant='link'
              className={isEqual(choice.value, state) ? styles.activeState : ''}
              onClick={() => onStateSelect(choice)}
              >
            {choice.label}
          </Button>
        </li>)}
    </ul>
  ), [onStateSelect, state]);

  const onDateFilterIconClicked = useCallback(() => {
    reportsTracker.track('Dates Icon Clicked');
  }, []);

  const onEventFilterIconClicked = useCallback(() => {
    reportsTracker.track('Filters Icon Clicked');
  }, []);

  const onSearchChange = useCallback(({ target: { value } }) => {
    setFilterText(value);
    eventFilterTracker.debouncedTrack('Clear Search Text Filter');
  }, []);

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

  const FilterDatePopover = useMemo(() => (
    <Popover placement='bottom' className={styles.filterPopover} id='filter-date-popover' data-testid='filter-date-popover'>
      <Popover.Header>
        <div className={styles.popoverTitle}>
          <ClockIcon />Date Range
          <Button type="button" variant='light' size='sm'
                  onClick={clearDateRange} disabled={!dateRangeModified}>Reset</Button>
        </div>
      </Popover.Header>
      <Popover.Body style={{ overflow: 'visible' }}>
        <EventFilterDateRangeSelector placement='bottom' endDateLabel='' startDateLabel=''/>
      </Popover.Body>
    </Popover>
  ), [clearDateRange, dateRangeModified, styles]);

  const FilterPopover = useMemo(() => (
    <Popover className={`${styles.filterPopover} ${styles.filters}`} id='filter-popover' data-testid='filter-popover'>
      <Popover.Header>
        <div className={styles.popoverTitle}>
          Report Filters
          <Button type="button" variant='light' size='sm'
                  onClick={resetPopoverFilters} disabled={!filterModified}>Reset all</Button>
        </div>
      </Popover.Header>
      <Popover.Body>
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
          <UserIcon className={styles.userIcon} />
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
      </Popover.Body>
    </Popover>
  ), [styles, currentFilterReportTypes, eventTypeFilterEmpty, eventTypeIDs.length, filterModified, noReportTypesChecked, onFilteredReportsSelect, onPriorityChange, onReportCategoryToggle, onReportTypeToggle, onReportedByChange, priority, priorityFilterModified, reportTypeFilterText, reportTypesCheckedCount, reportedByFilterModified, resetPopoverFilters, resetPriorityFilter, resetReportTypes, resetReportedByFilter, resetStateFilter, selectedReporters, someReportTypesChecked, stateFilterModified, toggleAllReportTypes]);


  return <>
    <form
      className={`${styles.form} ${className} ${styles.oldNavigation}`}
      data-testid="eventFilter-form"
      onSubmit={e => e.preventDefault()}
      >
      <div className={styles.controls}>
        <SearchBar
          className={`${styles.search} ${!hasChildrenComponents ? styles.wider : ''}`}
          placeholder='Search Reports...'
          value={filterText}
          onChange={onSearchChange}
          onClear={onSearchClear}
        />
        <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='bottom' overlay={FilterPopover} flip={true}>
          <Button
            variant={filterModified ? 'primary' : 'light'}
            size='sm'
            className={styles.popoverTrigger}
            data-testid='filter-btn'
          >
            <FilterIcon className={styles.filterIcon} onClick={onEventFilterIconClicked} /> <span>Filters</span>
          </Button>
        </OverlayTrigger>
        <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={FilterDatePopover} flip={true}>
          <Button
            variant={dateRangeModified ? 'primary' : 'light'}
            size='sm'
            className={styles.popoverTrigger}
            data-testid='date-filter-btn'
          >
            <ClockIcon className={styles.clockIcon} onClick={onDateFilterIconClicked}/>
            <span>Dates</span>
          </Button>
        </OverlayTrigger>
        {children}
      </div>
    </form>
    {isLargeLayout && <div className={`${styles.filterStringWrapper} ${className}`} data-testid='general-reset-wrapper'>
      <FriendlyFilterString
        className={styles.friendlyFilterString}
        dateRange={date_range}
        isFiltered={isFilterModified(eventFilter)}
        sortConfig={sortConfig}
        totalFeedCount={feedEvents.count}
      />
      {(filterModified || dateRangeModified || isSortModified) && <Button type="button" variant='light' size='sm' onClick={resetAllFilters} data-testid='general-reset-btn'><RefreshIcon />Reset</Button>}
    </div>}
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
