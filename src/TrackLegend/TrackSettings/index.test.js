import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';
import { mockStore } from '../../__test-helpers/MockStore';
import { setTrackLength, setTrackLengthOrigin, TRACK_LENGTH_ORIGINS } from '../../ducks/tracks';

import TrackSettings from '.';

jest.mock('../../ducks/tracks', () => ({
  ...jest.requireActual('../../ducks/tracks'),
  setTrackLength: jest.fn(),
  setTrackLengthOrigin: jest.fn(),
}));

describe('SubjectTrackLegend - TrackSettings', () => {
  const onClose = jest.fn();

  let setTrackLengthMock, setTrackLengthOriginMock, store;
  beforeEach(() => {
    setTrackLengthMock = jest.fn(() => () => {});
    setTrackLength.mockImplementation(setTrackLengthMock);
    setTrackLengthOriginMock = jest.fn(() => () => {});
    setTrackLengthOrigin.mockImplementation(setTrackLengthOriginMock);

    store = {
      data: {
        eventFilter: {
          filter: {
            date_range: {
              lower: '2020-01-01T06:00:00.000Z',
            },
          },
        },
      },
      view: {
        trackSettings: {
          length: 21,
          origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH,
        },
      },
    };
  });

  const renderTrackSettings = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <TrackSettings onClose={onClose} {...props} />
    </Provider>
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('closes the track settings', () => {
    renderTrackSettings();

    expect(onClose).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Close the track settings'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('changes the track length origin to the lower event filter date range', () => {
    renderTrackSettings();

    expect(setTrackLengthOrigin).not.toHaveBeenCalled();

    userEvent.click(screen.getAllByRole('radio')[0]);

    expect(setTrackLengthOrigin).toHaveBeenCalledTimes(1);
    expect(setTrackLengthOrigin).toHaveBeenCalledWith(TRACK_LENGTH_ORIGINS.EVENT_FILTER);
  });

  test('changes the track length origin to a custom length', () => {
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    renderTrackSettings();

    expect(setTrackLengthOrigin).not.toHaveBeenCalled();

    userEvent.click(screen.getAllByRole('radio')[1]);

    expect(setTrackLengthOrigin).toHaveBeenCalledTimes(1);
    expect(setTrackLengthOrigin).toHaveBeenCalledWith(TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH);
  });

  test('disables the track length inputs if the track length origin is the event filter', () => {
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    renderTrackSettings();

    expect(screen.getByRole('slider')).toBeDisabled();
    expect(screen.getAllByLabelText('Track length in days')[1]).toBeDisabled();
  });

  test('does not disable the track length inputs if the track length origin is a custom length', () => {
    renderTrackSettings();

    expect(screen.getByRole('slider')).toBeEnabled();
    expect(screen.getAllByLabelText('Track length in days')[1]).toBeEnabled();
  });

  test('changes the track length when the user interacts with the slider', () => {
    renderTrackSettings();

    expect(setTrackLength).toHaveBeenCalledTimes(1);
    expect(setTrackLength).toHaveBeenCalledWith(21);

    fireEvent.change(screen.getByRole('slider'), { target: { value: 60 } });

    expect(setTrackLength).toHaveBeenCalledTimes(2);
    expect(setTrackLength).toHaveBeenCalledWith(60);
  });

  test('changes the track length when the user interacts with the numeric input', () => {
    renderTrackSettings();

    expect(setTrackLength).toHaveBeenCalledTimes(1);
    expect(setTrackLength).toHaveBeenCalledWith(21);

    userEvent.type(screen.getAllByLabelText('Track length in days')[1], '{backspace}');

    expect(setTrackLength).toHaveBeenCalledTimes(2);
    expect(setTrackLength).toHaveBeenCalledWith(2);
  });

  test('shows an error if the custom length inputs have an invalid value', () => {
    renderTrackSettings();

    fireEvent.change(screen.getAllByLabelText('Track length in days')[1], { target: { value: 0 } });
    const customLenghtSlider = screen.getByRole('slider');
    const customLenghtNumericInput = screen.getAllByLabelText('Track length in days')[1];

    expect(screen.getByText('Please enter a track length between 1 and 365.')).toBeVisible();
    expect(customLenghtSlider).toBeInvalid();
    expect(customLenghtSlider).toHaveAttribute('aria-errormessage', 'customLengthErrorMessage');
    expect(customLenghtNumericInput).toBeInvalid();
    expect(customLenghtNumericInput).toHaveAttribute('aria-errormessage', 'customLengthErrorMessage');
  });

  test('does not show an error if the custom length inputs have a valid value', () => {
    renderTrackSettings();

    const customLenghtSlider = screen.getByRole('slider');
    const customLenghtNumericInput = screen.getAllByLabelText('Track length in days')[1];

    expect(screen.queryByText('Please enter a track length between 1 and 365.')).toBeNull();
    expect(customLenghtSlider).toBeValid();
    expect(customLenghtSlider).not.toHaveAttribute('aria-errormessage');
    expect(customLenghtNumericInput).toBeValid();
    expect(customLenghtNumericInput).not.toHaveAttribute('aria-errormessage');
  });
});
