import React, { memo } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Collapsible from 'react-collapsible';

import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';
import intersection from 'lodash/intersection';
import uniq from 'lodash/uniq';

import { EVENT_STATE_CHOICES as states } from '../constants';
import { updateEventFilter, resetEventFilter, INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { calcFriendlyDurationString } from '../utils/datetime';
import { trackEvent } from '../utils/analytics';

import EventFilterDateRangeSelector from './DateRange';
import FriendlyEventFilterString from './FriendlyEventFilterString';
import ReportTypeMultiSelect from '../ReportTypeMultiSelect';
// import CheckMark from '../Checkmark';
import SearchBar from '../SearchBar';
import { ReactComponent as FilterIcon } from '../common/images/icons/filter-icon.svg';

import styles from './styles.module.scss';


const { Toggle, Menu, Item } = Dropdown;

const EventFilter = (props) => {
  const { eventFilter, eventTypes, updateEventFilter, resetEventFilter } = props;
  const { state, filter: { date_range, event_type: currentFilterReportTypes, text } } = eventFilter;

  const eventTypeIDs = eventTypes.map(type => type.id);

  const reportTypesCheckedCount = intersection(eventTypeIDs, currentFilterReportTypes).length;
  const allReportTypesChecked = reportTypesCheckedCount === eventTypeIDs.length;
  const someReportTypesChecked = !allReportTypesChecked && !!reportTypesCheckedCount;
  const noReportTypesChecked = !allReportTypesChecked && !someReportTypesChecked;

  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range);
  const stateFilterModified = !isEqual(INITIAL_FILTER_STATE.state, state);

  const filterModified = dateRangeModified || !allReportTypesChecked || stateFilterModified;

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

  const onReportTypeToggle = ({ id }) => {
    if (currentFilterReportTypes.includes(id)) {
      trackEvent('Feed', 'Uncheck Event Type Filter');
      updateEventFilter({ filter: { event_type: currentFilterReportTypes.filter(item => item !== id) } });
    } else {
      trackEvent('Feed', 'Check Event Type Filter');
      updateEventFilter({ filter: { event_type: [...currentFilterReportTypes, id] } });
    }
  };


  const { lower, upper } = date_range;

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

  const SelectedState = () => <Toggle>
    <h5 className={styles.filterTitle}>
      State
      <small className={stateFilterModified ? styles.modified : ''}>{states.find(choice => isEqual(choice.value, state)).label}</small>
      <Button type="button" variant='light' size='sm' disabled={!stateFilterModified} onClick={resetStateFilter}>Reset</Button>
    </h5>
  </Toggle>;

  const StateChoices = () => <Menu>
    {states.map(choice => <Item key={choice.label} onClick={() => onStateSelect(choice)}>{choice.label}</Item>)}
  </Menu>;

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

  const DateRangeTrigger = <h5 className={styles.filterTitle}>
    Date Range
    <small className={dateRangeModified ? styles.modified : ''}>
      {!dateRangeModified && 'One month ago until now'}
      {dateRangeModified && calcFriendlyDurationString(lower, upper)}
    </small>
    <Button type="button" variant='light' size='sm' disabled={!dateRangeModified} onClick={clearDateRange}>Reset</Button>
  </h5>;

  const ReportTypeTrigger = <h5 className={styles.filterTitle}>
    Report Types
    <small className={!allReportTypesChecked ? styles.modified : ''}>
      {allReportTypesChecked && 'All selected'}
      {someReportTypesChecked && `${reportTypesCheckedCount} of ${eventTypeIDs.length} selected`}
      {noReportTypesChecked && 'None selected'}
    </small>
    <Button type="button" variant='light' size='sm' disabled={allReportTypesChecked} onClick={toggleAllReportTypes}>Reset</Button>
  </h5>;

  const FilterPopover = <Popover className={`${styles.filterPopover} ${filterModified}`} id='filter-popover'>
    <Popover.Title>
      <div className={styles.popoverTitle}>
        Report Filters
        <Button type="button" style={{ marginLeft: 'auto' }} variant='primary' size='sm'
          onClick={resetPopoverFilters} disabled={!filterModified}>Reset all</Button>
      </div>
    </Popover.Title>
    <Popover.Content>
      <Dropdown className={styles.dropdown}>
        <SelectedState />
        <StateChoices />
      </Dropdown>
      <Collapsible
        transitionTime={0.1}
        lazyRender={true}
        className={styles.closedFilterDrawer}
        openedClassName={styles.openedFilterDrawer}
        trigger={DateRangeTrigger}>
        <EventFilterDateRangeSelector endDateLabel='' startDateLabel='' />
      </Collapsible>
      <Collapsible
        transitionTime={0.1}
        lazyRender={true}
        className={styles.closedFilterDrawer}
        openedClassName={styles.openedFilterDrawer}
        trigger={ReportTypeTrigger}>
        {/* <span className={styles.toggleAllReportTypes}>
          <CheckMark onClick={toggleAllReportTypes} fullyChecked={allReportTypesChecked} partiallyChecked={someReportTypesChecked} />
          {allReportTypesChecked && 'All'}
          {someReportTypesChecked && 'Some'}
          {noReportTypesChecked && 'None'}
        </span> */}
        <ReportTypeMultiSelect selectedReportTypeIDs={currentFilterReportTypes} onCategoryToggle={onReportCategoryToggle} onTypeToggle={onReportTypeToggle} />
      </Collapsible>
    </Popover.Content>
  </Popover>;

  return <form className={styles.form} onSubmit={e => e.preventDefault()}>
    <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={FilterPopover}>
      <span className={`${styles.popoverTrigger} ${filterModified ? styles.modified : ''}`}>
        <FilterIcon />
        <span>Filters</span>
      </span>
    </OverlayTrigger>
    <SearchBar className={styles.search} placeholder='Search Reports...' text={text || ''}
      onChange={onSearchChange} onClear={onSearchClear} />
    <FriendlyEventFilterString className={styles.filterDetails} />
  </form>;
};

const mapStateToProps = ({ data: { eventFilter, eventTypes } }) => ({ eventFilter, eventTypes });

export default connect(mapStateToProps, { updateEventFilter, resetEventFilter })(memo(EventFilter));
