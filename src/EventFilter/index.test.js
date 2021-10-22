

import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, within, fireEvent } from '@testing-library/react';
import ReactGA from 'react-ga';
import store from '../store';

import { DEFAULT_EVENT_SORT } from '../utils/event-filter';
import { INITIAL_FILTER_STATE } from '../ducks/event-filter';

import EventFilter from './';

ReactGA.initialize('dummy', { testMode: true });
const feedSort = DEFAULT_EVENT_SORT;
const resetMock = jest.fn();


test('rendering without crashing', () => {
  render(
    <Provider store={store}>
      <EventFilter sortConfig={feedSort} onResetAll={resetMock}/>
    </Provider>
  );
});

describe('default filters state', () => {

  beforeEach(() => {

    render(
      <Provider store={store}>
        <EventFilter sortConfig={feedSort} onResetAll={resetMock}/>
      </Provider>
    );
  });

  test('the default state for "Filter" button should be gray', async () => {
    const filterBtn = screen.getByTestId('filter-btn');
    expect(filterBtn.className).toEqual(expect.stringContaining('btn-light'));
  });

  test('the default state for "Date" button, should be gray and change to blue if any filter is applied', () => {
    const dateFilterBtn = screen.getByTestId('date-filter-btn');
    expect(dateFilterBtn.className).toEqual(expect.stringContaining('btn-light'));
  });

  test('the popover for the filters should be shown after clicking on filter button', async () => {
    const filterBtn = screen.getByTestId('filter-btn');
    filterBtn.click();

    const filterPopover = screen.getByTestId('filter-popover');
    expect(filterPopover).toBeDefined();
  });

  test('the popover for the date filters should be shown after clicking on date filter button', async () => {
    const dateFilterBtn = screen.getByTestId('date-filter-btn');
    dateFilterBtn.click();

    const dateFilterPopover = screen.getByTestId('filter-date-popover');
    expect(dateFilterPopover).toBeDefined();
  });

  test('the reset button should not been displayed if there are not applied filters', () => {
    const resetWrapper = screen.getByTestId('general-reset-wrapper');
    const generalResetButton = within(resetWrapper).queryByText('Reset');
    expect(generalResetButton).toBeNull();
  });


});

describe('After filters being applied', () => {
  beforeEach(async () => {
    render(
      <Provider store={store}>
        <EventFilter sortConfig={feedSort} onResetAll={resetMock}/>
      </Provider>
    );

    const filterBtn = await screen.getByTestId('filter-btn');
    fireEvent.click(filterBtn);
    const filterPopover = await screen.getByTestId('filter-popover');
    const resolvedOptionBtn = await within(filterPopover).queryByText('Resolved');
    fireEvent.click(resolvedOptionBtn);
  });

  test('the state color for "Filter" button after filters being applied should be primary', async () => {
    const filterBtn = await screen.getByTestId('filter-btn');
    expect(filterBtn.className).toEqual(expect.stringContaining('btn-primary'));
  });

  test('the state color for "Date" button after filters being applied should be primary', async () => {
    const dateFilterBtn = await screen.getByTestId('date-filter-btn');
    fireEvent.click(dateFilterBtn);
    const dateFilterPopover = await screen.getByTestId('filter-date-popover');
    const todayOptionBtn = await within(dateFilterPopover).queryByText('Today');
    fireEvent.click(todayOptionBtn);

    expect(dateFilterBtn.className).toEqual(expect.stringContaining('btn-primary'));
  });

  test('the reset button is displayed only when a filter is applied', async () => {
    const resetWrapper = await screen.getByTestId('general-reset-wrapper');
    const resetButton = await within(resetWrapper).queryByText('Reset');
    expect(resetButton).toBeDefined();

    fireEvent.click(resetButton);
    const resetButtonAgain = await within(resetWrapper).queryByText('Reset');
    expect(resetButtonAgain).toBeNull();
  });

  test('all the applied filters disappear when the reset button is clicked', async () => {
    const resetWrapper = await screen.getByTestId('general-reset-wrapper');
    const resetButton = await within(resetWrapper).queryByText('Reset');
    fireEvent.click(resetButton);

    const currentFilterState = await store.getState().data.eventFilter;
    expect(currentFilterState).toEqual(INITIAL_FILTER_STATE);
  });

  test('clicking on reset button should call onResetAll', async () => {
    const resetWrapper = await screen.getByTestId('general-reset-wrapper');
    const resetButton = await within(resetWrapper).queryByText('Reset');
    fireEvent.click(resetButton);

    expect(resetMock).toHaveBeenCalledTimes(1);
  });
});