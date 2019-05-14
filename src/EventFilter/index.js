import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Popover, OverlayTrigger, Button, Dropdown } from 'react-bootstrap';
import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';
import isNil from 'lodash/isNil';

import { EVENT_STATE_CHOICES as states } from '../constants';
import { updateEventFilter, resetEventFilter } from '../ducks/event-filter';
import DateRangeSelector from '../DateRangeSelector';
import ReportTypeMultiSelect from '../ReportTypeMultiSelect';
import SearchBar from '../SearchBar';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

const EventFilter = (props) => {
  const { eventFilter, eventTypes, updateEventFilter, resetEventFilter } = props;
  const { state, filter: { date_range, event_type, event_category, text, priority } } = eventFilter;

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
      ...eventFilter.filter,
      text: value,
    }
  });
  const onStateSelect = ({ value }) => updateEventFilter({ state: value });
  const onStartDateChange = (val) => updateEventFilter({
    filter: {
      ...eventFilter.filter,
      date_range: {
        ...eventFilter.filter.date_range,
        lower: val instanceof Date ? val.toISOString() : null,
      },
    },
  });
  const onEndDateChange = (val) => updateEventFilter({
    filter: {
      ...eventFilter.filter,
      date_range: {
        ...eventFilter.filter.date_range,
        upper: val instanceof Date ? val.toISOString() : null,
      },
    },
  });

  return <form className={styles.form}>
    <SearchBar placeholder='Search Reports...' text={text} onChange={onSearchChange} />
    <ReportTypeMultiSelect />
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
};

const mapStatetoProps = ({ data: { eventFilter, eventTypes } }) => ({ eventFilter, eventTypes })

export default connect(mapStatetoProps, { updateEventFilter, resetEventFilter })(EventFilter);