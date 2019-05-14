import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Popover, OverlayTrigger, Button, Dropdown } from 'react-bootstrap';
import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';
import isNil from 'lodash/isNil';
import intersection from 'lodash/intersection';
import uniq from 'lodash/uniq';

import { EVENT_STATE_CHOICES as states } from '../constants';
import { updateEventFilter, resetEventFilter } from '../ducks/event-filter';
import DateRangeSelector from '../DateRangeSelector';
import ReportTypeMultiSelect from '../ReportTypeMultiSelect';
import CheckMark from '../Checkmark';
import SearchBar from '../SearchBar';


import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

const EventFilter = memo((props) => {
  const { eventFilter, eventTypes, updateEventFilter, resetEventFilter } = props;
  const { state, filter: { date_range, event_type: currentFilterReportTypes, event_category, text, priority } } = eventFilter;

  const eventTypeIDs = eventTypes.map(type => type.id);

  const allReportTypesChecked = intersection(eventTypeIDs, currentFilterReportTypes).length === eventTypeIDs.length;
  const someReportTypesChecked = !allReportTypesChecked && !!intersection(eventTypeIDs, currentFilterReportTypes).length;

  const toggleAllReportTypes = () => {
    if (allReportTypesChecked) {
      updateEventFilter({ filter: { event_type: [null] } });
    } else {
      updateEventFilter({ filter: { event_type: eventTypeIDs } });
    }
  };

  const onReportCategoryToggle = ({ category }) => {
    const toToggle = eventTypes.filter(({ category: { value: v } }) => v === category).map(({ id }) => id);
    const allShown = intersection(currentFilterReportTypes, toToggle).length === toToggle.length;
    if (allShown) {
      updateEventFilter({ filter: { event_type: currentFilterReportTypes.filter(id => !toToggle.includes(id)) } });
    } else {
      updateEventFilter({ filter: { event_type: uniq([...currentFilterReportTypes, ...toToggle])} });
    }
  };

  const onReportTypeToggle = ({ id }) => {
    if (currentFilterReportTypes.includes(id)) {
      updateEventFilter({ filter: { event_type: currentFilterReportTypes.filter(item => item !== id) } });
    } else {
      updateEventFilter({ filter: { event_type: [...currentFilterReportTypes, id] } });
    }
  };


  const { lower, upper } = date_range;

  const hasLower = !isNil(lower);
  const hasUpper = !isNil(upper);

  const updateEventFilterDebounced = debounce(function (update) {
    updateEventFilter(update);
  }, 300);

  const SelectedState = () => <Toggle>
    <Item>{states.find(choice => isEqual(choice.value, state)).label}</Item>
  </Toggle>;

  const StateChoices = () => <Menu>
    {states.map(choice => <Item key={choice.label} onClick={() => onStateSelect(choice)}>{choice.label}</Item>)}
  </Menu>;

  const onSearchChange = ({ target: { value } }) => updateEventFilterDebounced({
    filter: {
      text: value,
    }
  });
  const onStateSelect = ({ value }) => updateEventFilter({ state: value });
  const onStartDateChange = (val) => updateEventFilter({
    filter: {
      date_range: {
        ...eventFilter.filter.date_range,
        lower: val instanceof Date ? val.toISOString() : null,
      },
    },
  });

  const onEndDateChange = (val) => updateEventFilter({
    filter: {
      date_range: {
        ...eventFilter.filter.date_range,
        upper: val instanceof Date ? val.toISOString() : null,
      },
    },
  });

  const popoverTitle = <h5 className={styles.popoverTitle}>
    <span className={styles.toggleAllReportTypes}>
      <CheckMark onClick={toggleAllReportTypes} fullyChecked={allReportTypesChecked} partiallyChecked={someReportTypesChecked} />
      All
    </span>
    <span>Report Types</span>
    <Button disabled={allReportTypesChecked} onClick={toggleAllReportTypes}>Reset</Button>
  </h5>

  const reportTypePopover = <Popover className={styles.eventFilterPopover} id='report-type-filter-popover' title={popoverTitle}>
    <ReportTypeMultiSelect selectedReportTypeIDs={currentFilterReportTypes} onCategoryToggle={onReportCategoryToggle} onTypeToggle={onReportTypeToggle} />
  </Popover>;

  return <form className={styles.form}>
    <SearchBar placeholder='Search Reports...' text={text} onChange={onSearchChange} />
    <OverlayTrigger rootClose trigger='click' placement='bottom' overlay={reportTypePopover}>
      <span className={!allReportTypesChecked ? styles.modified : ''}>Types</span>
    </OverlayTrigger>
    <DateRangeSelector
      className={styles.dateSelect}
      endDate={hasUpper ? new Date(upper) : upper}
      endDateNullMessage='Now'
      onEndDateChange={onEndDateChange}
      onStartDateChange={onStartDateChange}
      startDate={hasLower ? new Date(lower) : lower}
      startDateNullMessage='One month ago'
    />
    <Dropdown>
      <SelectedState />
      <StateChoices />
    </Dropdown>

  </form>;
});

const mapStatetoProps = ({ data: { eventFilter, eventTypes } }) => ({ eventFilter, eventTypes })

export default connect(mapStatetoProps, { updateEventFilter, resetEventFilter })(EventFilter);