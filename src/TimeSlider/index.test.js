import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { act, fireEvent, render, screen, waitFor } from '../test-utils';
import {
  clearVirtualDate,
  setVirtualDate,
  setTimeSliderState,
} from '../ducks/timeslider';
import { mockStore } from '../__test-helpers/MockStore';
import { resetGlobalDateRange } from '../ducks/global-date-range';

import TimeSlider, { FRAME_INTERVAL_MS } from '.';

jest.mock('../EventFilter/DateRange', () => ({
  __esModule: true,
  default: () => <div data-testid="event-filter-date-range" />,
}));

jest.mock('../ducks/timeslider', () => ({
  ...jest.requireActual('../ducks/timeslider'),
  clearVirtualDate: jest.fn(),
  setVirtualDate: jest.fn(),
  setTimeSliderState: jest.fn(),
}));

jest.mock('../ducks/global-date-range', () => ({
  __esModule: true,
  ...jest.requireActual('../ducks/global-date-range'),
  resetGlobalDateRange: jest.fn(),
}));

describe('TimeSlider', () => {
  let store;
  beforeEach(() => {
    clearVirtualDate.mockImplementation(() => () => {});
    setTimeSliderState.mockImplementation(() => () => {});
    setVirtualDate.mockImplementation(() => () => {});
    resetGlobalDateRange.mockImplementation(() => () => {});

    store = {
      data: {
        eventFilter: {
          filter: {
            date_range: {
              lower: '2020-01-01T06:00:00.000Z',
              upper: null,
            },
          },
        },
      },
      view: {
        timeSliderState: {
          virtualDate: null,
        },
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  const renderTimeSlider = (props) => render(
    <Provider store={mockStore(store)}>
      <TimeSlider {...props} />
    </Provider>
  );

  test('shows the play button', async () => {
    renderTimeSlider();

    const playButton = screen.getByRole('button', { name: 'Play timeslider' });

    expect(playButton).toBeVisible();
    expect(playButton).toHaveAttribute('title', 'Play timeslider');
  });

  test('starts playing when the user clicks the play button', async () => {
    renderTimeSlider();

    await userEvent.click(screen.getByRole('button', { name: 'Play timeslider' }));

    expect(screen.getByRole('button', { name: 'Stop timeslider' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Play timeslider' })).toBeNull();
  });

  test('shows the stop button', async () => {
    renderTimeSlider();

    await userEvent.click(screen.getByRole('button', { name: 'Play timeslider' }));

    const stopButton = screen.getByRole('button', { name: 'Stop timeslider' });

    expect(stopButton).toBeVisible();
    expect(stopButton).toHaveAttribute('title', 'Stop timeslider');
  });

  test('stops playing when the user clicks the stop button', async () => {
    renderTimeSlider();

    await userEvent.click(screen.getByRole('button', { name: 'Play timeslider' }));
    await userEvent.click(screen.getByRole('button', { name: 'Stop timeslider' }));

    expect(screen.getByRole('button', { name: 'Play timeslider' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Stop timeslider' })).toBeNull();
  });

  test('shows the virtual date and time', async () => {
    store.view.timeSliderState.virtualDate = '2020-06-15T12:00:00.000Z';

    renderTimeSlider();

    const time = screen.getByRole('time');

    expect(time).toBeVisible();
    expect(time).toHaveAttribute('datetime', '2020-06-15T12:00:00.000Z');
  });

  test('shows the slider', async () => {
    renderTimeSlider();

    const timeSlider = screen.getByRole('slider', { name: 'Timeslider' });

    expect(timeSlider).toBeVisible();
    expect(timeSlider).toHaveAttribute('aria-valuetext');
    expect(timeSlider).toHaveAttribute('max', '1');
    expect(timeSlider).toHaveAttribute('min', '0');
    expect(timeSlider).toHaveAttribute('step', 'any');
    expect(timeSlider).toHaveAttribute('type', 'range');
  });

  test('changes the slider value when the user drags the slider', async () => {
    renderTimeSlider();

    expect(setVirtualDate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('slider', { name: 'Timeslider' }), { target: { value: '0.5' } });

    expect(setVirtualDate).toHaveBeenCalledTimes(1);
  });

  test('pauses the playback when the user changes the slider value', async () => {
    renderTimeSlider();

    await userEvent.click(screen.getByRole('button', { name: 'Play timeslider' }));

    expect(screen.getByRole('button', { name: 'Stop timeslider' })).toBeVisible();

    fireEvent.change(screen.getByRole('slider', { name: 'Timeslider' }), { target: { value: '0.5' } });

    expect(screen.getByRole('button', { name: 'Play timeslider' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Stop timeslider' })).toBeNull();
  });

  test('shows the slider labels', async () => {
    store.data.eventFilter.filter.date_range.upper = '2020-12-31T23:59:59.000Z';
    renderTimeSlider();

    const endDateLabel = screen.getByTestId('timeSlider-endDate');

    expect(screen.getByTestId('timeSlider-startDate')).toBeVisible();
    expect(endDateLabel).toBeVisible();
    expect(endDateLabel).not.toHaveTextContent('Now');
  });

  test('shows the slider labels when there is no upper date range', async () => {
    renderTimeSlider();

    const endDateLabel = screen.getByTestId('timeSlider-endDate');

    expect(endDateLabel).toBeVisible();
    expect(endDateLabel).toHaveTextContent('Now');
  });

  test('shows the date range button', async () => {
    renderTimeSlider();

    const changeDateRangeButton = screen.getByRole('button', { name: 'Change date range' });

    expect(changeDateRangeButton).toBeInTheDocument();
  });

  test('opens the date range popover when the user clicks the date range button', async () => {
    renderTimeSlider();

    expect(screen.queryByRole('tooltip', { name: 'Date Range Reset' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Change date range' }));

    expect(await screen.findByRole('tooltip', { name: 'Date Range Reset' })).toBeVisible();
  });

  test('shows the date range popover header', async () => {
    renderTimeSlider();

    await userEvent.click(screen.getByRole('button', { name: 'Change date range' }));

    expect(screen.getByText('Date Range')).toBeVisible();
  });

  test('shows the date range popover reset button', async () => {
    renderTimeSlider();

    await userEvent.click(screen.getByRole('button', { name: 'Change date range' }));

    const resetButton = await screen.findByRole('button', { name: 'Reset' });

    expect(resetButton).toBeVisible();
  });

  test('resets the date range when the user clicks the reset button', async () => {
    renderTimeSlider();

    await userEvent.click(screen.getByRole('button', { name: 'Change date range' }));

    expect(resetGlobalDateRange).not.toHaveBeenCalled();

    await userEvent.click(await screen.findByRole('button', { name: 'Reset' }));

    expect(resetGlobalDateRange).toHaveBeenCalledTimes(1);
  });

  test('shows the date range popover body', async () => {
    renderTimeSlider();

    await userEvent.click(screen.getByRole('button', { name: 'Change date range' }));

    expect(await screen.findByTestId('event-filter-date-range')).toBeVisible();
  });

  test('shows the close button', async () => {
    renderTimeSlider();

    const closeTimeSliderButton = screen.getByRole('button', { name: 'Close timeslider' });

    expect(closeTimeSliderButton).toBeVisible();
    expect(closeTimeSliderButton).toHaveAttribute('title', 'Close timeslider');
  });

  test('closes the time slider when the user clicks the close button', async () => {
    renderTimeSlider();

    expect(setTimeSliderState).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Close timeslider' }));

    expect(setTimeSliderState).toHaveBeenCalledTimes(1);
    expect(setTimeSliderState).toHaveBeenCalledWith(false);
  });

  test('resets the virtual date to the end of the range and pauses the playback when the event filter date range is changed', async () => {
    const { rerender } = renderTimeSlider();

    await userEvent.click(screen.getByRole('button', { name: 'Play timeslider' }));

    expect(screen.getByRole('button', { name: 'Stop timeslider' })).toBeVisible();
    expect(clearVirtualDate).toHaveBeenCalledTimes(1);

    rerender(
      <Provider store={mockStore({
        ...store,
        data: {
          ...store.data,
          eventFilter: {
            filter: {
              date_range: {
                lower: '2021-01-01T06:00:00.000Z',
                upper: null,
              },
            },
          },
        },
      })}>
        <TimeSlider />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Play timeslider' })).toBeInTheDocument();
    });

    expect(clearVirtualDate).toHaveBeenCalledTimes(2);
  });

  test('automatically advances the virtual date by intervals when the playback is active', async () => {
    jest.useFakeTimers();

    store.data.eventFilter.filter.date_range.upper = '2020-12-31T23:59:59.000Z';
    store.view.timeSliderState.virtualDate = '2020-06-15T12:00:00.000Z';
    renderTimeSlider();

    fireEvent.click(screen.getByRole('button', { name: 'Play timeslider' }));

    expect(setVirtualDate).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(FRAME_INTERVAL_MS);
    });

    expect(setVirtualDate).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(FRAME_INTERVAL_MS);
    });

    expect(setVirtualDate).toHaveBeenCalledTimes(3);
  });
});
