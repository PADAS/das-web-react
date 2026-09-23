import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../../../../../__test-helpers/MockStore';
import { render, screen } from '../../../../../../test-utils';

import Settings from './';

describe('SideBar - PatrolsManager - PatrolsFeed - Filters - DateRangePopover - Settings', () => {
  let onChange;
  let store;

  beforeEach(() => {
    onChange = jest.fn();

    store = { data: { patrolFilter: { filter: { patrols_overlap_daterange: false } } } };
  });

  const renderSettings = (props) => render(
    <Provider store={mockStore(store)}>
      <Settings onChange={onChange} {...props} />
    </Provider>
  );

  test('names the date filter mode group for assistive technology', () => {
    renderSettings();

    expect(screen.getByRole('group', { name: 'Date filter mode' })).toBeInTheDocument();
  });

  test('offers the two date filter modes as one choice', () => {
    renderSettings();

    expect(screen.getByRole('radio', { name: /^Filter by start date/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /^Filter by date range overlap/ })).not.toBeChecked();
  });

  test('marks the overlap mode as the one in use when the filter is set to it', () => {
    store.data.patrolFilter.filter.patrols_overlap_daterange = true;

    renderSettings();

    expect(screen.getByRole('radio', { name: /^Filter by date range overlap/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /^Filter by start date/ })).not.toBeChecked();
  });

  test('reports the overlap mode when the user picks it', async () => {
    renderSettings();

    await userEvent.click(screen.getByRole('radio', { name: /^Filter by date range overlap/ }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('reports the start date mode when the user picks it', async () => {
    store.data.patrolFilter.filter.patrols_overlap_daterange = true;

    renderSettings();

    await userEvent.click(screen.getByRole('radio', { name: /^Filter by start date/ }));

    expect(onChange).toHaveBeenCalledWith(false);
  });
});
