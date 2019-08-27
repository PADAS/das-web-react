import React, { memo } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Collapsible from 'react-collapsible';

import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';
import isNil from 'lodash/isNil';
import intersection from 'lodash/intersection';
import uniq from 'lodash/uniq';

import { EVENT_STATE_CHOICES as states } from '../constants';
import { updateEventFilter, INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { dateIsValid, calcFriendlyDurationString } from '../utils/datetime';
import { trackEvent } from '../utils/analytics';

import FriendlyEventFilterString from './FriendlyEventFilterString';
import DateRangeSelector from '../DateRangeSelector';
import ReportTypeMultiSelect from '../ReportTypeMultiSelect';
// import CheckMark from '../Checkmark';
import SearchBar from '../SearchBar';
import { ReactComponent as FilterIcon } from '../common/images/icons/filter-icon.svg';


import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

const EventFilter = memo((props) => {
  const { eventFilter, eventTypes, updateEventFilter } = props;
  const { state, filter: { date_range, event_type: currentFilterReportTypes, text } } = eventFilter;

  const eventTypeIDs = eventTypes.map(type => type.id);

  const allReportTypesChecked = intersection(eventTypeIDs, currentFilterReportTypes).length === eventTypeIDs.length;
  const someReportTypesChecked = !allReportTypesChecked && !!intersection(eventTypeIDs, currentFilterReportTypes).length;
  const noReportTypesChecked = !allReportTypesChecked && !someReportTypesChecked;

  const dateRangeModified = !isNil(date_range.lower) || !isNil(date_range.upper);
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

  const hasLower = !isNil(lower);
  const hasUpper = !isNil(upper);

  const updateEventFilterDebounced = debounce(function (update) {
    updateEventFilter(update);
  }, 200);

  const onStateSelect = ({ value }) => {
    updateEventFilter({ state: value });
    trackEvent('Feed', `Select '${value}' State Filter`);
  };

  const onStartDateChange = (val) => {
    updateEventFilter({
      filter: {
        date_range: {
          ...eventFilter.filter.date_range,
          lower: dateIsValid(val) ? val.toISOString() : null,
        },
      },
    });
    trackEvent('Feed', 'Change Start Date Filter');
  };

  const onEndDateChange = (val) => {
    updateEventFilter({
      filter: {
        date_range: {
          ...eventFilter.filter.date_range,
          upper: dateIsValid(val) ? val.toISOString() : null,
        },
      },
    });
    trackEvent('Feed', 'Change Filter End Date Filter');
  };

  const onDateRangeChange = ({ lower, upper }) => updateEventFilter({
    filter: {
      date_range: {
        lower,
        upper,
      },
    },
  });

  const resetPopoverFilters = () => {
    updateEventFilter({
      state: INITIAL_FILTER_STATE.state,
      filter: {
        event_type: eventTypeIDs,
        date_range: {
          lower: null,
          upper: null,
        },
      },
    });
    trackEvent('Feed', 'Click Reset All Filters');
  };

  const clearDateRange = (e) => {
    e.stopPropagation();
    updateEventFilter({
      filter: {
        date_range: {
          lower: null,
          upper: null,
        },
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
      filter: {
        text: !!value ? value.toLowerCase() : null,
      }
    });
    trackEvent('Feed', 'Change Search Text Filter');
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
      {allReportTypesChecked && 'All visible'}
      {someReportTypesChecked && 'Some visible'}
      {noReportTypesChecked && 'None visible'}
    </small>
    <Button type="button" variant='light' size='sm' disabled={allReportTypesChecked} onClick={toggleAllReportTypes}>Reset</Button>
  </h5>;

  const FilterPopover = <Popover className={`${styles.filterPopover} ${filterModified}`} id='filter-popover' title={<h4 className={styles.popoverTitle}>
    Report Filters
    <Button type="button" style={{ marginLeft: 'auto' }} variant='primary' size='sm' onClick={resetPopoverFilters} disabled={!filterModified}>Reset all</Button>
  </h4>}>
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
      <DateRangeSelector
        className={styles.dateSelect}
        endDate={hasUpper ? new Date(upper) : upper}
        endDateNullMessage='Now'
        onDateRangeChange={onDateRangeChange}
        onEndDateChange={onEndDateChange}
        onStartDateChange={onStartDateChange}
        showPresets={true}
        startDate={hasLower ? new Date(lower) : lower}
        startDateNullMessage='One month ago'
        gaEventSrc='Event Filter'
      />
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
  </Popover>;

  return <form className={styles.form} onSubmit={e => e.preventDefault()}>
    <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={FilterPopover}>
      <span className={`${styles.popoverTrigger} ${filterModified ? styles.modified : ''}`}>
        <FilterIcon />
        <span>Filters</span>
      </span>
    </OverlayTrigger>
    <SearchBar className={styles.search} placeholder='Search Reports...' text={text || ''} onChange={onSearchChange} />
    <FriendlyEventFilterString className={styles.filterDetails} />
  </form>;
});

const mapStatetoProps = ({ data: { eventFilter, eventTypes } }) => ({ eventFilter, eventTypes });

export default connect(mapStatetoProps, { updateEventFilter })(EventFilter);