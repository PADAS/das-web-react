import React, { useState } from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../../../../../__test-helpers/MockStore';
import { render, screen, within } from '../../../../../../test-utils';
import { TrackerContext } from '../../../../../../utils/analytics';

import EventTypesFilter from './';

jest.mock('../../../../../../SvgIcon', () => jest.fn(() => null));

const LOGISTICS_CATEGORY = { display: 'Logistics', value: 'logistics' };

const SECURITY_CATEGORY = { display: 'Security', value: 'security' };

const FENCE_EVENT_TYPE = {
  category: LOGISTICS_CATEGORY,
  display: 'Fence',
  id: 'fence-id',
  ordernum: 1,
  value: 'fence',
  version: 1,
};

const ROAD_DAMAGE_EVENT_TYPE = {
  category: LOGISTICS_CATEGORY,
  display: 'Road Damage',
  id: 'road-damage-id',
  ordernum: 2,
  value: 'road_damage',
  version: 1,
};

const SNARE_EVENT_TYPE = {
  category: 'security',
  display: 'Snare',
  id: 'snare-id',
  ordernum: 1,
  value: 'snare',
  version: 2,
};

const ControlledEventTypesFilter = ({ initialFilterText = '', ...otherProps }) => {
  const [filterText, setFilterText] = useState(initialFilterText);

  return <EventTypesFilter filterText={filterText} onChangeFilterText={setFilterText} {...otherProps} />;
};

describe('SideBar - EventsManager - EventsFeed - Filters - FiltersPopover - EventTypesFilter', () => {
  let onChange, store, track;

  beforeEach(() => {
    onChange = jest.fn();
    track = jest.fn();

    store = {
      data: {
        eventCategories: { security: SECURITY_CATEGORY },
        eventTypes: [FENCE_EVENT_TYPE, ROAD_DAMAGE_EVENT_TYPE, SNARE_EVENT_TYPE],
      },
      view: {},
    };
  });

  const renderEventTypesFilter = (props = {}) => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track }}>
        <ControlledEventTypesFilter id="event-types" onChange={onChange} value={[]} {...props} />
      </TrackerContext.Provider>
    </Provider>
  );

  const getCheckbox = (name) => screen.getByRole('checkbox', { name });

  const getSearchBar = () => screen.getByRole('searchbox', { name: 'Search event types' });

  test('groups the event types under a checkbox for their category', () => {
    renderEventTypesFilter();

    const logisticsItem = getCheckbox('Logistics').closest('li');

    expect(within(logisticsItem).getAllByRole('checkbox')).toHaveLength(3);
    expect(within(logisticsItem).getByRole('checkbox', { name: 'Fence' })).toBeInTheDocument();
    expect(within(logisticsItem).getByRole('checkbox', { name: 'Road Damage' })).toBeInTheDocument();
    expect(within(getCheckbox('Security').closest('li')).getByRole('checkbox', { name: 'Snare' }))
      .toBeInTheDocument();
  });

  test('leaves every checkbox unchecked while the filter is empty', () => {
    renderEventTypesFilter();

    screen.getAllByRole('checkbox').forEach((checkbox) => expect(checkbox).not.toBeChecked());
  });

  test('checks the event types the filter names and the categories they complete', () => {
    renderEventTypesFilter({ value: [FENCE_EVENT_TYPE.id, SNARE_EVENT_TYPE.id] });

    expect(getCheckbox('Fence')).toBeChecked();
    expect(getCheckbox('Road Damage')).not.toBeChecked();
    expect(getCheckbox('Snare')).toBeChecked();
    expect(getCheckbox('Security')).toBeChecked();
  });

  test('shows a category with only some of its event types checked as partially checked', () => {
    renderEventTypesFilter({ value: [FENCE_EVENT_TYPE.id] });

    expect(getCheckbox('Logistics')).toBePartiallyChecked();
    expect(getCheckbox('Security')).not.toBePartiallyChecked();
  });

  test('adds an event type to the filter when the user checks it', async () => {
    renderEventTypesFilter({ value: [SNARE_EVENT_TYPE.id] });

    await userEvent.click(getCheckbox('Fence'));

    expect(onChange).toHaveBeenCalledWith([SNARE_EVENT_TYPE.id, FENCE_EVENT_TYPE.id]);
    expect(track).toHaveBeenCalledWith('Check an event type filter');
  });

  test('removes an event type from the filter when the user unchecks it', async () => {
    renderEventTypesFilter({ value: [FENCE_EVENT_TYPE.id, SNARE_EVENT_TYPE.id] });

    await userEvent.click(getCheckbox('Fence'));

    expect(onChange).toHaveBeenCalledWith([SNARE_EVENT_TYPE.id]);
    expect(track).toHaveBeenCalledWith('Uncheck an event type filter');
  });

  test('adds the missing event types of a category when the user checks it', async () => {
    renderEventTypesFilter({ value: [ROAD_DAMAGE_EVENT_TYPE.id] });

    await userEvent.click(getCheckbox('Logistics'));

    expect(onChange).toHaveBeenCalledWith([ROAD_DAMAGE_EVENT_TYPE.id, FENCE_EVENT_TYPE.id]);
    expect(track).toHaveBeenCalledWith('Check an event type category filter');
  });

  test('removes the event types of a checked category when the user unchecks it', async () => {
    renderEventTypesFilter({ value: [FENCE_EVENT_TYPE.id, ROAD_DAMAGE_EVENT_TYPE.id, SNARE_EVENT_TYPE.id] });

    await userEvent.click(getCheckbox('Logistics'));

    expect(onChange).toHaveBeenCalledWith([SNARE_EVENT_TYPE.id]);
    expect(track).toHaveBeenCalledWith('Uncheck an event type category filter');
  });

  test('shows only the event types matching the search', async () => {
    renderEventTypesFilter();

    await userEvent.type(getSearchBar(), 'road');

    expect(getCheckbox('Road Damage')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Fence' })).toBeNull();
    expect(screen.queryByRole('checkbox', { name: 'Security' })).toBeNull();
  });

  test('keeps every event type of a category whose name matches the search', async () => {
    renderEventTypesFilter();

    await userEvent.type(getSearchBar(), 'logis');

    expect(getCheckbox('Fence')).toBeInTheDocument();
    expect(getCheckbox('Road Damage')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Snare' })).toBeNull();
  });

  test('does not offer to set the search matches while there is no search', () => {
    renderEventTypesFilter();

    expect(screen.queryByRole('button', { name: /matching event type/ })).toBeNull();
  });

  test('sets the filter to the search matches when the user picks them', async () => {
    renderEventTypesFilter({ value: [SNARE_EVENT_TYPE.id] });

    await userEvent.type(getSearchBar(), 'logis');
    await userEvent.click(screen.getByRole('button', { name: 'Set these: 2 matching event types' }));

    expect(onChange).toHaveBeenCalledWith([FENCE_EVENT_TYPE.id, ROAD_DAMAGE_EVENT_TYPE.id]);
    expect(track).toHaveBeenCalledWith('Set the event types filter to the search matches');
  });

  test('tells the user when no event type matches the search, with nothing to set', async () => {
    renderEventTypesFilter();

    await userEvent.type(getSearchBar(), 'volcano');

    expect(screen.getByText('No matching event types')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Set these: 0 matching event types' })).toBeDisabled();
  });

  test('clears the search when the user clears the search bar', async () => {
    renderEventTypesFilter({ initialFilterText: 'road' });

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(getSearchBar()).toHaveValue('');
    expect(getCheckbox('Fence')).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith('Clear the event types search');
  });
});
