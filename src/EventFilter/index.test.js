import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { Provider } from 'react-redux';
import store from '../store';
import userEvent from '@testing-library/user-event';

import { DEFAULT_EVENT_SORT } from '../constants';
import {
  INITIAL_FILTER_STATE,
  UPDATE_EVENT_FILTER,
} from '../ducks/event-filter';

import EventFilter from './';
import { mockStore } from '../__test-helpers/MockStore';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { render, screen, waitFor, within } from '../test-utils';

const feedSort = DEFAULT_EVENT_SORT;
const resetMock = jest.fn();

const renderEventFilter = (mockedStore = store) => {
  render(
    <Provider store={mockedStore}>
      <EventFilter sortConfig={feedSort} onResetAll={resetMock} />
    </Provider>
  );
};

test('rendering without crashing', () => {
  renderEventFilter();
});

describe('EventFilter', () => {
  let initialState;
  beforeEach(() => {
    initialState = {
      data: {
        subjectStore: {},
        eventTypes,
        eventFilter: cloneDeep(INITIAL_FILTER_STATE),
        eventSchemas: {
          globalSchema: {
            properties: {
              reported_by: {
                enum_ext: [
                  {
                    value: { id: 'Leader 1' },
                  },
                  {
                    value: { id: 'Leader 2' },
                  },
                ],
              },
            },
          },
        },
        feedEvents: { results: [] },
      },
    };
  });

  describe('default filters state', () => {
    test('the default state for Filter button should be light', async () => {
      renderEventFilter(mockStore(initialState));

      const filterBtn = screen.getByTestId('filter-btn');
      expect(filterBtn.className).toEqual(expect.stringContaining('btn-light'));
    });

    test('the default state for Date button, should be light', () => {
      renderEventFilter(mockStore(initialState));

      const dateFilterBtn = screen.getByTestId('date-filter-btn');
      expect(dateFilterBtn.className).toEqual(
        expect.stringContaining('btn-light')
      );
    });

    test('the popover for the filters should be shown after clicking on filter button', async () => {
      renderEventFilter(mockStore(initialState));

      const filterBtn = screen.getByTestId('filter-btn');
      filterBtn.click();

      const filterPopover = screen.getByTestId('filter-popover');
      expect(filterPopover).toBeDefined();
    });

    test('the popover for the date filters should be shown after clicking on date filter button', async () => {
      renderEventFilter(mockStore(initialState));

      const dateFilterBtn = screen.getByTestId('date-filter-btn');
      dateFilterBtn.click();

      const dateFilterPopover = screen.getByTestId('filter-date-popover');
      expect(dateFilterPopover).toBeDefined();
    });

    test('the reset button should not been displayed if there are not applied filters', () => {
      renderEventFilter(mockStore(initialState));

      const resetWrapper = screen.getByTestId('general-reset-wrapper');
      const generalResetButton = within(resetWrapper).queryByText('Reset');
      expect(generalResetButton).toBeNull();
    });
  });

  describe('After filters being applied', () => {
    test('the state color for Filter button after filters being applied should be primary', async () => {
      initialState.data.eventFilter.filter.priority = [200];
      renderEventFilter(mockStore(initialState));

      const filterBtn = await screen.getByTestId('filter-btn');
      expect(filterBtn.className).toEqual(
        expect.stringContaining('btn-primary')
      );
    });

    test('the state color for Date button after filters being applied should be primary', async () => {
      initialState.data.eventFilter.filter.date_range.lower = '2024-01-01T06:00:00.000Z';
      renderEventFilter(mockStore(initialState));

      const dateFilterBtn = await screen.getByTestId('date-filter-btn');

      expect(dateFilterBtn.className).toEqual(
        expect.stringContaining('btn-primary')
      );
    });

    test('the reset button is not displayed if a filter is not applied', async () => {
      renderEventFilter(mockStore(initialState));

      const resetWrapper = await screen.getByTestId('general-reset-wrapper');
      const resetButton = await within(resetWrapper).queryByText('Reset');
      expect(resetButton).toBeNull();
    });

    test('the reset button is displayed only when a filter is applied', async () => {
      initialState.data.eventFilter.filter.priority = [200];
      renderEventFilter(mockStore(initialState));

      const resetWrapper = await screen.getByTestId('general-reset-wrapper');
      const resetButton = await within(resetWrapper).queryByText('Reset');
      expect(resetButton).toBeDefined();
    });

    test('clicking on reset button should call onResetAll', async () => {
      initialState.data.eventFilter.filter.priority = [200];
      renderEventFilter(mockStore(initialState));

      const resetWrapper = await screen.getByTestId('general-reset-wrapper');
      const resetButton = within(resetWrapper).queryByText('Reset');
      userEvent.click(resetButton);

      expect(resetMock).toHaveBeenCalledTimes(1);
    });

    test('clicking on reset button should erase the search text value', async () => {
      jest.useFakeTimers();

      initialState.data.eventFilter.filter.text = 'text';
      const mockedStore = mockStore(initialState);
      renderEventFilter(mockedStore);

      const resetWrapper = await screen.getByTestId('general-reset-wrapper');

      const resetButton = await within(resetWrapper).queryByText('Reset');
      userEvent.click(resetButton);

      await waitFor(() => {
        const actions = mockedStore.getActions();

        expect(actions[0].type).toBe(UPDATE_EVENT_FILTER);
        expect(actions[0].payload.filter.text).toBe('');
      });

      jest.useRealTimers();
    });
  });
});
