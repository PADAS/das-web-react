import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, within } from '@testing-library/react';
import ReactGA from 'react-ga';
import store from '../store';
import userEvent from '@testing-library/user-event';

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

  test('the default state for "Filter" button should be light', async () => {
    const filterBtn = screen.getByTestId('filter-btn');
    expect(filterBtn.className).toEqual(expect.stringContaining('btn-light'));
  });

  test('the default state for "Date" button, should be light', () => {
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

  describe('state filter', () => {
    let filterBtn, optionsContainer, stateFilterOptions;

    beforeEach(() => {
      filterBtn = screen.getByTestId('filter-btn');
      filterBtn.click();
      optionsContainer = screen.getByTestId('state-filter-options');
      stateFilterOptions = within(optionsContainer).getAllByRole('button');
    });

    test('it should not change the state if the same option is selected', async () => {
      const currentStateFilter = await store.getState().data.eventFilter.state;
      stateFilterOptions[0].click();

      expect(stateFilterOptions[0].classList.contains('activeState')).toBe(true);
      expect(stateFilterOptions[1].classList.contains('activeState')).toBe(false);

      const newStateFilter = await store.getState().data.eventFilter.state;
      expect(newStateFilter).toEqual(currentStateFilter);
    });

    test('it should change the state if a different option is selected', async () => {
      const currentStateFilter = await store.getState().data.eventFilter.state;
      stateFilterOptions[1].click();

      optionsContainer = screen.getByTestId('state-filter-options');
      stateFilterOptions = within(optionsContainer).getAllByRole('button');

      expect(stateFilterOptions[0].classList.contains('activeState')).toBe(false);
      expect(stateFilterOptions[1].classList.contains('activeState')).toBe(true);

      const newStateFilter = await store.getState().data.eventFilter.state;
      expect(newStateFilter).not.toEqual(currentStateFilter);
    });
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
    userEvent.click(filterBtn);
    const filterPopover = await screen.getByTestId('filter-popover');
    const resolvedOptionBtn = await within(filterPopover).queryByText('Resolved');
    userEvent.click(resolvedOptionBtn);
  });

  test('the state color for "Filter" button after filters being applied should be primary', async () => {
    const filterBtn = await screen.getByTestId('filter-btn');
    expect(filterBtn.className).toEqual(expect.stringContaining('btn-primary'));
  });

  test('the state color for "Date" button after filters being applied should be primary', async () => {
    const dateFilterBtn = await screen.getByTestId('date-filter-btn');
    userEvent.click(dateFilterBtn);
    const dateFilterPopover = await screen.getByTestId('filter-date-popover');
    const todayOptionBtn = await within(dateFilterPopover).queryByText('Today');
    userEvent.click(todayOptionBtn);

    expect(dateFilterBtn.className).toEqual(expect.stringContaining('btn-primary'));
  });

  test('the reset button is displayed only when a filter is applied', async () => {
    const resetWrapper = await screen.getByTestId('general-reset-wrapper');
    const resetButton = await within(resetWrapper).queryByText('Reset');
    expect(resetButton).toBeDefined();

    userEvent.click(resetButton);
    const resetButtonAgain = await within(resetWrapper).queryByText('Reset');
    expect(resetButtonAgain).toBeNull();
  });

  test('all the applied filters disappear when the reset button is clicked', async () => {
    const resetWrapper = await screen.getByTestId('general-reset-wrapper');
    const resetButton = await within(resetWrapper).queryByText('Reset');
    userEvent.click(resetButton);

    const currentFilterState = await store.getState().data.eventFilter;
    expect(currentFilterState).toEqual(INITIAL_FILTER_STATE);
  });

  test('clicking on reset button should call onResetAll', async () => {
    const resetWrapper = await screen.getByTestId('general-reset-wrapper');
    const resetButton = await within(resetWrapper).queryByText('Reset');
    userEvent.click(resetButton);

    expect(resetMock).toHaveBeenCalledTimes(1);
  });
});