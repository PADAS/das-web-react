import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Popover, OverlayTrigger, Button, Dropdown } from 'react-bootstrap';
import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';

import { EVENT_STATE_CHOICES as states } from '../constants';
import { updateEventFilter, resetEventFilter } from '../ducks/event-filter';
import DateRangeSelector from '../DateRangeSelector';
import SearchBar from '../SearchBar';

const { Toggle, Menu, Item } = Dropdown;

const EventFilter = (props) => {
  const { eventFilter, eventTypes, updateEventFilter, resetEventFilter } = props;
  const { state, filter: { date_range, event_type, event_category, text, priority } } = eventFilter;

  const { lower, upper } = date_range;

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
        lower: val.toISOString(),
      },
    },
  });
  const onEndDateChange = (val) => updateEventFilter({
    filter: {
      ...eventFilter.filter,
      date_range: {
        ...eventFilter.filter.date_range,
        upper: val.toISOString(),
      },
    },
  });

  return <div>
    <SearchBar placeholder='Search Reports...' text={text} onChange={onSearchChange} />
    <DateRangeSelector
      endDate={upper}
      onEndDateChange={onEndDateChange}
      onStartDateChange={onStartDateChange}
      startDate={new Date(lower)}
    />
    <Dropdown>
      <SelectedState />
      <StateChoices />
    </Dropdown>

  </div>;
};

const mapStatetoProps = ({ data: { eventFilter, eventTypes } }) => ({ eventFilter, eventTypes })

export default connect(mapStatetoProps, { updateEventFilter, resetEventFilter })(EventFilter);