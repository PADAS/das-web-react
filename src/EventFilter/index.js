import React, { memo } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';
import Collapsible from 'react-collapsible';

import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';
import intersection from 'lodash/intersection';
import uniq from 'lodash/uniq';

import { EVENT_STATE_CHOICES } from '../constants';
import { updateEventFilter, resetEventFilter, INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { trackEvent } from '../utils/analytics';

import { reportedBy } from '../selectors';

import EventFilterDateRangeSelector from './DateRange';
import FriendlyEventFilterString from './FriendlyEventFilterString';
import ReportTypeMultiSelect from '../ReportTypeMultiSelect';
import PriorityPicker from '../PriorityPicker';
import ReportedBySelect from '../ReportedBySelect';
// import CheckMark from '../Checkmark';
import SearchBar from '../SearchBar';
import { ReactComponent as FilterIcon } from '../common/images/icons/filter-icon.svg';
import { ReactComponent as UserIcon } from '../common/images/icons/user-profile.svg';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from './styles.module.scss';

const EventFilter = (props) => {
  const { children, className, eventFilter, eventTypes, reporters, resetEventFilter, updateEventFilter } = props;
  const { state, filter: { date_range, event_type: currentFilterReportTypes, priority, reported_by, text } } = eventFilter;

  const eventTypeIDs = eventTypes.map(type => type.id);

  const reportTypesCheckedCount = intersection(eventTypeIDs, currentFilterReportTypes).length;
  const allReportTypesChecked = reportTypesCheckedCount === eventTypeIDs.length;
  const someReportTypesChecked = !allReportTypesChecked && !!reportTypesCheckedCount;
  const noReportTypesChecked = !allReportTypesChecked && !someReportTypesChecked;

  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range);
  const stateFilterModified = !isEqual(INITIAL_FILTER_STATE.state, state);
  const priorityFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.priority, priority);
  const reportedByFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.reported_by, reported_by);

  const filterModified = priorityFilterModified || !allReportTypesChecked || stateFilterModified || reportedByFilterModified;

  const selectedReporters = eventFilter.filter.reported_by && !!eventFilter.filter.reported_by.length ?

    eventFilter.filter.reported_by
      .map(id =>
        reporters.find(r => r.id === id)
      ).filter(item => !!item)
    : null;

  const toggleAllReportTypes = (e) => {
    e.stopPropagation();
    if (allReportTypesChecked) {
      trackEvent('Feed', 'Uncheck All Event Types Filter');
      updateEventFilter({ filter: { event_type: [null] } });
    } else {
      trackEvent('Feed', 'Check All Event Types Filter');
      updateEventFilter({ filter: { event_type: eventTypeIDs } });
    }
  };

  const onReportCategoryToggle = ({ value }) => {
    const toToggle = eventTypes.filter(({ category: { value: v } }) => v === value).map(({ id }) => id);
    const allShown = intersection(currentFilterReportTypes, toToggle).length === toToggle.length;
    if (allShown) {
      trackEvent('Feed', 'Uncheck Event Type Category Filter');
      updateEventFilter({ filter: { event_type: currentFilterReportTypes.filter(id => !toToggle.includes(id)) } });
    } else {
      trackEvent('Feed', 'Uncheck Event Type Category Filter');
      updateEventFilter({ filter: { event_type: uniq([...currentFilterReportTypes, ...toToggle]) } });
    }
  };

  const onReportedByChange = (values) => {
    if (values && !!values.length) {
      updateEventFilter({
        filter: {
          reported_by: uniq(values.map(({ id }) => id)),
        }
      });
    } else {
      updateEventFilter({
        filter: {
          reported_by: null,
        }
      });
    }
  };

  const onPriorityChange = (value) => {
    const removingValue = priority.includes(value);
    const newVal = removingValue
      ? priority.filter(item => item !== value)
      : [...priority, value];

    updateEventFilter({
      filter: {
        priority: newVal,
      },
    });
  }

  const onReportTypeToggle = ({ id }) => {
    if (currentFilterReportTypes.includes(id)) {
      trackEvent('Feed', 'Uncheck Event Type Filter');
      updateEventFilter({ filter: { event_type: currentFilterReportTypes.filter(item => item !== id) } });
    } else {
      trackEvent('Feed', 'Check Event Type Filter');
      updateEventFilter({ filter: { event_type: [...currentFilterReportTypes, id] } });
    }
  };

  const onFilteredReportsSelect = (types) => {
    updateEventFilter({ filter: { event_type: types.map(({ id }) => id) } });
  };

  const updateEventFilterDebounced = debounce(function (update) {
    updateEventFilter(update);
  }, 200);

  const onStateSelect = ({ value }) => {
    updateEventFilter({ state: value });
    trackEvent('Feed', `Select '${value}' State Filter`);
  };

  const resetPopoverFilters = () => {
    resetEventFilter();
  };

  const clearDateRange = (e) => {
    e.stopPropagation();
    updateEventFilter({
      filter: {
        date_range: INITIAL_FILTER_STATE.filter.date_range,
      },
    });
    trackEvent('Feed', 'Click Reset Date Range Filter');
  };

  const resetStateFilter = (e) => {
    e.stopPropagation();
    updateEventFilter({ state: INITIAL_FILTER_STATE.state });
    trackEvent('Feed', 'Click Reset State Filter');
  };

  const resetPriorityFilter = (e) => {
    e.stopPropagation();
    updateEventFilter({ filter: { priority: INITIAL_FILTER_STATE.filter.priority } });
    trackEvent('Feed', 'Click Reset Priority Filter');
  };

  const resetReportedByFilter = (e) => {
    e.stopPropagation();
    updateEventFilter({ filter: { reported_by: INITIAL_FILTER_STATE.filter.reported_by } });
    trackEvent('Feed', 'Click Reset Reported By Filter');
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

  const onSearchChange = ({ target: { value } }) => {
    updateEventFilterDebounced({
      filter: { text: !!value ? value.toLowerCase() : null, }
    });
    trackEvent('Feed', 'Change Search Text Filter');
  };

  const onSearchClear = (e) => {
    e.stopPropagation();
    updateEventFilter({
      filter: { text: '', }
    });
    trackEvent('Feed', 'Clear Search Text Filter');
  };

  const FilterDatePopover = <Popover className={styles.filterPopover} id='filter-date-popover'>
    <Popover.Title>
      <div className={styles.popoverTitle}>
        <ClockIcon />Report Date Range
        <Button type="button" variant='primary' size='sm'
          onClick={clearDateRange} disabled={!dateRangeModified}>Reset</Button>
      </div>
    </Popover.Title>
    <Popover.Content>
      <EventFilterDateRangeSelector endDateLabel='' startDateLabel='' />
    </Popover.Content>
  </Popover>;

  const FilterPopover = <Popover className={styles.filterPopover} id='filter-popover'>
    <Popover.Title>
      <div className={styles.popoverTitle}>
        Report Filters
        <Button type="button" variant='primary' size='sm'
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
        <h5 className={styles.filterTitle}>
          Report Types
          <small className={!allReportTypesChecked ? styles.modified : ''}>
            {allReportTypesChecked && 'All selected'}
            {someReportTypesChecked && `${reportTypesCheckedCount} of ${eventTypeIDs.length} selected`}
            {noReportTypesChecked && 'None selected'}
          </small>
          <Button type="button" variant='light' size='sm' disabled={allReportTypesChecked} onClick={toggleAllReportTypes}>Reset</Button>
        </h5>
        <ReportTypeMultiSelect selectedReportTypeIDs={currentFilterReportTypes} onCategoryToggle={onReportCategoryToggle} onFilteredItemsSelect={onFilteredReportsSelect} onTypeToggle={onReportTypeToggle} />
      </div>
    </Popover.Content>
  </Popover>;

  return <form className={`${styles.form} ${className}`} onSubmit={e => e.preventDefault()}>
    <div className={styles.controls}>
      <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={FilterPopover}>
        <span className={`${styles.popoverTrigger} ${filterModified ? styles.modified : ''}`}>
          <FilterIcon className={styles.filterIcon} />
          <span>Filters</span>
        </span>
      </OverlayTrigger>
      <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={FilterDatePopover}>
        <span className={`${styles.popoverTrigger} ${dateRangeModified ? styles.modified : ''}`}>
          <ClockIcon className={styles.clockIcon} />
          <span>Dates</span>
        </span>
      </OverlayTrigger>
      <SearchBar className={styles.search} placeholder='Search Reports...' text={text || ''}
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

export default connect(mapStateToProps, { updateEventFilter, resetEventFilter })(memo(EventFilter));
