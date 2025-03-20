import React from 'react';
import { Provider } from 'react-redux';
import { toast } from 'react-toastify';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';
import { setCurrentUserLocation } from '../ducks/location';

import GetUserLocationButton from './';

jest.mock('react-toastify', () => ({
  ...jest.requireActual('react-toastify'),
  toast: { error: jest.fn() },
}));

jest.mock('../ducks/location', () => ({
  ...jest.requireActual('../ducks/location'),
  setCurrentUserLocation: jest.fn(),
}));

describe('GetUserLocationButton', () => {
  const onGet = jest.fn();

  let store, setCurrentUserLocationMock;
  beforeEach(() => {
    setCurrentUserLocationMock = jest.fn(() => () => {});
    setCurrentUserLocation.mockImplementation(setCurrentUserLocationMock);

    store = {
      view: {
        userLocation: null,
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderGetUserLocationButton = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <GetUserLocationButton onGet={onGet} {...props} />
    </Provider>
  );

  test('configures the button with other props', () => {
    renderGetUserLocationButton({ className: 'className' });

    expect(screen.getByLabelText('Get current position')).toHaveClass('className');
  });

  test('returns the user position from the store if it is available', () => {
    store.view.userLocation = { coords: { latitude: 10, longitude: 10 } };
    const onClick = jest.fn();
    renderGetUserLocationButton({ onClick });

    expect(onClick).not.toHaveBeenCalled();
    expect(onGet).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Get current position'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onGet).toHaveBeenCalledTimes(1);
    expect(onGet).toHaveBeenCalledWith({ latitude: 10, longitude: 10 });
  });

  test('requests the user position from the window.navigator.geolocation API and returns it', () => {
    const onClick = jest.fn();
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((successCallback) => {
        successCallback({ coords: { latitude: 15, longitude: 15 } });
      }),
    };
    renderGetUserLocationButton({ onClick });

    expect(onClick).not.toHaveBeenCalled();
    expect(onGet).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Get current position'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onGet).toHaveBeenCalledTimes(1);
    expect(onGet).toHaveBeenCalledWith({ latitude: 15, longitude: 15 });
  });

  test('shows an error if window.navigator.geolocation API fails', () => {
    const onClick = jest.fn();
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((_, errorCallback) => {
        errorCallback({ message: 'Error' });
      }),
    };
    renderGetUserLocationButton({ onClick });

    expect(onClick).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Get current position'));

    expect(onGet).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Could not read your current location: Error');
  });

  test('shows a loading overlay while fetching the user location', () => {
    jest.useFakeTimers();

    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((successCallback) => {
        setTimeout(() => successCallback({ coords: { latitude: 15, longitude: 15 } }), 500);
      }),
    };
    renderGetUserLocationButton();

    userEvent.click(screen.getByLabelText('Get current position'));

    expect(screen.getByText('Trying to read your location...')).toBeVisible();

    jest.runOnlyPendingTimers();

    expect(screen.queryByText('Trying to read your location...')).toBeNull();

    jest.useRealTimers();
  });

  test('renders the button content', () => {
    renderGetUserLocationButton({ renderContent: () => <div data-testid="content" /> });

    const button = screen.getByLabelText('Get current position');

    expect(within(button).getByTestId('content')).toBeVisible();
  });

  test('renders a default button content', () => {
    renderGetUserLocationButton();

    expect(screen.getByLabelText('Get current position')).toHaveTextContent('gps-location-icon.svg');
  });
});
