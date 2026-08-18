import React from 'react';
import { Provider } from 'react-redux';
import { toast } from 'react-toastify';
import userEvent from '@testing-library/user-event';

import { act, render, screen, within } from '../test-utils';
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

  test('configures the button with other props', async () => {
    renderGetUserLocationButton({ className: 'className' });

    expect(screen.getByLabelText('Get current position')).toHaveClass('className');
  });

  test('returns the user position from the store if it is available', async () => {
    store.view.userLocation = { coords: { latitude: 10, longitude: 10 } };
    const onClick = jest.fn();
    renderGetUserLocationButton({ onClick });

    expect(onClick).not.toHaveBeenCalled();
    expect(onGet).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Get current position'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onGet).toHaveBeenCalledTimes(1);
    expect(onGet).toHaveBeenCalledWith({ latitude: 10, longitude: 10 });
  });

  test('requests the user position from the window.navigator.geolocation API and returns it', async () => {
    const onClick = jest.fn();
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((successCallback) => {
        successCallback({ coords: { latitude: 15, longitude: 15 } });
      }),
    };
    renderGetUserLocationButton({ onClick });

    expect(onClick).not.toHaveBeenCalled();
    expect(onGet).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Get current position'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onGet).toHaveBeenCalledTimes(1);
    expect(onGet).toHaveBeenCalledWith({ latitude: 15, longitude: 15 });
  });

  test('shows an error if window.navigator.geolocation API fails', async () => {
    const onClick = jest.fn();
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((_, errorCallback) => {
        errorCallback({ message: 'Error' });
      }),
    };
    renderGetUserLocationButton({ onClick });

    expect(onClick).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Get current position'));

    expect(onGet).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Could not read your current location: Error');
  });

  test('shows an error if the position is unavailable', async () => {
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((_, errorCallback) => {
        errorCallback({ code: 2, message: 'Position unavailable', PERMISSION_DENIED: 1 });
      }),
    };
    renderGetUserLocationButton();

    await userEvent.click(screen.getByLabelText('Get current position'));

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Could not read your current location: Position unavailable');
  });

  test('does not show an error toast if the user blocked the location permission', async () => {
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((_, errorCallback) => {
        errorCallback({ code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1 });
      }),
    };
    renderGetUserLocationButton();

    await userEvent.click(screen.getByLabelText('Get current position'));

    expect(onGet).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('still forwards a blocked permission to a custom error handler', async () => {
    const onError = jest.fn();
    const error = { code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1 };
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((_, errorCallback) => errorCallback(error)),
    };
    renderGetUserLocationButton({ onError });

    await userEvent.click(screen.getByLabelText('Get current position'));

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error);
    expect(toast.error).not.toHaveBeenCalled();
  });

  describe('when it is disabled', () => {
    test('marks the button as disabled to assistive technology without removing it from the tab order', async () => {
      renderGetUserLocationButton({ isDisabled: true });

      const button = screen.getByLabelText('Get current position');

      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).not.toBeDisabled();

      button.focus();

      expect(document.activeElement).toBe(button);
    });

    test('does not request the location when clicked', async () => {
      const onClick = jest.fn();
      window.navigator.geolocation = { getCurrentPosition: jest.fn() };
      renderGetUserLocationButton({ isDisabled: true, onClick });

      await userEvent.click(screen.getByLabelText('Get current position'));

      expect(onClick).not.toHaveBeenCalled();
      expect(onGet).not.toHaveBeenCalled();
      expect(window.navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
    });

    test('does not return a location already held in the store when clicked', async () => {
      store.view.userLocation = { coords: { latitude: 10, longitude: 10 } };
      renderGetUserLocationButton({ isDisabled: true });

      await userEvent.click(screen.getByLabelText('Get current position'));

      expect(onGet).not.toHaveBeenCalled();
    });

    test('keeps the class names given by the caller', async () => {
      renderGetUserLocationButton({ className: 'className', isDisabled: true });

      expect(screen.getByLabelText('Get current position')).toHaveClass('className');
    });
  });

  test('is not marked as disabled by default', async () => {
    renderGetUserLocationButton();

    expect(screen.getByLabelText('Get current position')).not.toHaveAttribute('aria-disabled');
  });

  test('shows a loading overlay while fetching the user location', async () => {
    jest.useFakeTimers();

    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((successCallback) => {
        setTimeout(() => successCallback({ coords: { latitude: 15, longitude: 15 } }), 500);
      }),
    };
    renderGetUserLocationButton();

    const user = userEvent.setup({ delay: null });
    await user.click(screen.getByLabelText('Get current position'));

    expect(screen.getByText('Trying to read your location...')).toBeVisible();

    act(() => jest.runOnlyPendingTimers());

    expect(screen.queryByText('Trying to read your location...')).toBeNull();

    jest.useRealTimers();
  });

  test('renders the button content', async () => {
    renderGetUserLocationButton({ renderContent: () => <div data-testid="content" /> });

    const button = screen.getByLabelText('Get current position');

    expect(within(button).getByTestId('content')).toBeVisible();
  });

  test('renders a default button content', async () => {
    renderGetUserLocationButton();

    expect(screen.getByTestId('gps-location-icon')).toBeVisible();
  });
});
