import React from 'react';
import { Provider } from 'react-redux';
import store from '../store';
import userEvent from '@testing-library/user-event';

import { DEFAULT_EVENT_SORT } from '../utils/event-filter';
import { INITIAL_FILTER_STATE, UPDATE_EVENT_FILTER } from '../ducks/event-filter';

import EventFilter, { UPDATE_FILTER_DEBOUNCE_TIME } from './';
import { mockStore } from '../__test-helpers/MockStore';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { render, screen, waitFor, within } from '../test-utils';

const feedSort = DEFAULT_EVENT_SORT;
const resetMock = jest.fn();
const initialState = {
  data: {
    subjectStore: {},
    eventTypes,
    eventFilter: {
      filter: {
        date_range: {
          lower: null,
          upper: null,
        },
        event_type: [],
        text: '',
        priority: []
      },
    },
    eventSchemas: {
      globalSchema: {
        properties: {
          reported_by: {
            enum_ext: [{
              value: { id: 'Leader 1' },
            }, {
              value: { id: 'Leader 2' },
            }],
          },
        },
      },
    },
    feedEvents: { results: [] }
  }
};

const renderEventFilter = (mockedStore = store) => {
  render(
    <Provider store={mockedStore}>
      <EventFilter sortConfig={feedSort} onResetAll={resetMock}/>
    </Provider>
  );
};

test('rendering without crashing', () => {
  renderEventFilter();
});

describe('default filters state', () => {

  beforeEach(() =>     renderEventFilter());

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

  const assertResolvedOptionBtn = async (store) => {
    renderEventFilter(store);
    const filterBtn = await screen.getByTestId('filter-btn');
    userEvent.click(filterBtn);
    const filterPopover = await screen.getByTestId('filter-popover');
    const resolvedOptionBtn = await within(filterPopover).queryByText('Resolved');
    userEvent.click(resolvedOptionBtn);
  };

  test('the state color for "Filter" button after filters being applied should be primary', async () => {
    await assertResolvedOptionBtn();
    const filterBtn = await screen.getByTestId('filter-btn');
    expect(filterBtn.className).toEqual(expect.stringContaining('btn-primary'));
  });

  test('the state color for "Date" button after filters being applied should be primary', async () => {
    await assertResolvedOptionBtn();
    const dateFilterBtn = await screen.getByTestId('date-filter-btn');
    userEvent.click(dateFilterBtn);
    const dateFilterPopover = await screen.getByTestId('filter-date-popover');
    const todayOptionBtn = await within(dateFilterPopover).queryByText('Today');
    userEvent.click(todayOptionBtn);

    expect(dateFilterBtn.className).toEqual(expect.stringContaining('btn-primary'));
  });

  test('the reset button is displayed only when a filter is applied', async () => {
    await assertResolvedOptionBtn();
    const resetWrapper = await screen.getByTestId('general-reset-wrapper');
    const resetButton = await within(resetWrapper).queryByText('Reset');
    expect(resetButton).toBeDefined();

    userEvent.click(resetButton);
    const resetButtonAgain = await within(resetWrapper).queryByText('Reset');
    expect(resetButtonAgain).toBeNull();
  });

  test('all the applied filters disappear when the reset button is clicked', async () => {
    await assertResolvedOptionBtn();
    const resetWrapper = await screen.getByTestId('general-reset-wrapper');
    const resetButton = await within(resetWrapper).queryByText('Reset');
    userEvent.click(resetButton);

    const currentFilterState = await store.getState().data.eventFilter;
    expect(currentFilterState).toEqual(INITIAL_FILTER_STATE);
  });

  test('clicking on reset button should call onResetAll', async () => {
    await assertResolvedOptionBtn();
    const resetWrapper = await screen.getByTestId('general-reset-wrapper');
    const resetButton = await within(resetWrapper).queryByText('Reset');
    userEvent.click(resetButton);

    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  test('clicking on reset button should erase the search text value', async () => {
    jest.useFakeTimers();
    const mockedStore = mockStore(initialState);
    await assertResolvedOptionBtn(mockedStore);
    const resetWrapper = await screen.getByTestId('general-reset-wrapper');
    const searchBar = await screen.getAllByTestId('search-input')[0];
    const searchValue = 'Chimpanzee';
    userEvent.type(searchBar, searchValue);
    jest.advanceTimersByTime(UPDATE_FILTER_DEBOUNCE_TIME);

    await waitFor(() => {
      const [, textSearchAction] = mockedStore.getActions();
      const { type, payload: { filter: { text } } } = textSearchAction;

      expect(type).toBe(UPDATE_EVENT_FILTER);
      expect(text).toBe(searchValue);
    });

    const resetButton = await within(resetWrapper).queryByText('Reset');
    userEvent.click(resetButton);

    await waitFor(() => {
      const [,, resetFiltersAction] = mockedStore.getActions();
      const { type } = resetFiltersAction;

      expect(type).toBe(UPDATE_EVENT_FILTER);
      expect(searchBar.value).toBe('');
    });

    jest.useRealTimers();
  });

  test('performing a search shows the reset button', async () => {
    jest.useFakeTimers();
    renderEventFilter();

    expect(screen.queryByTestId('general-reset-btn')).toBeNull();

    const searchBar = await screen.getAllByTestId('search-input')[0];
    const searchValue = 'Chimpanzee';
    userEvent.type(searchBar, searchValue);
    jest.advanceTimersByTime(UPDATE_FILTER_DEBOUNCE_TIME);

    expect(screen.queryByTestId('general-reset-btn')).toBeVisible();

    jest.useRealTimers();
  });

});