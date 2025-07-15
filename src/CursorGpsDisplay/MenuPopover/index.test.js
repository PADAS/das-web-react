import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';
import { GPS_FORMATS } from '../../utils/location';
import { mockStore } from '../../__test-helpers/MockStore';
import { showPopup } from '../../ducks/popup';
import useJumpToLocation from '../../hooks/useJumpToLocation';

import MenuPopover from '.';

jest.mock('../../ducks/popup', () => ({
  ...jest.requireActual('../../ducks/popup'),
  showPopup: jest.fn(),
}));

jest.mock('../../hooks/useJumpToLocation', () => jest.fn());

describe('CursorGpsDisplay - MenuPopover', () => {
  const onClose = jest.fn();

  let jumpToLocationMock, showPopupMock, store, user;
  beforeEach(async () => {
    showPopupMock = jest.fn(() => () => {});
    showPopup.mockImplementation(showPopupMock);
    jumpToLocationMock = jest.fn();
    useJumpToLocation.mockImplementation(() => jumpToLocationMock);

    user = await userEvent.setup({ delay: null });

    store = {
      data: {},
      view: {
        coordinateReferenceSystems: {
          selectedSystems: Object.values(GPS_FORMATS),
          storedSystems: [],
        },
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderMenuPopover = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <MenuPopover
        buttonRef={{
          current: {
            contains: () => false,
          },
        }}
        className=""
        onClose={onClose}
        {...props}
      />
    </Provider>
  );

  test('jumps to the typed coordinates by pressing enter', async () => {
    renderMenuPopover();

    await user.type(screen.getByLabelText('GPS location'), '10,10');

    expect(jumpToLocationMock).not.toHaveBeenCalled();
    expect(showPopup).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    await user.keyboard('{Enter}');

    expect(jumpToLocationMock).toHaveBeenCalledTimes(1);
    expect(jumpToLocationMock).toHaveBeenCalledWith([10, 10]);
    expect(onClose).toHaveBeenCalledTimes(1);

    jest.runOnlyPendingTimers();

    expect(showPopup).toHaveBeenCalledTimes(1);
    expect(showPopup).toHaveBeenCalledWith('dropped-marker', {
      coordinates: [10, 10],
      location: {
        lat: 10,
        lng: 10,
      },
      popupAttrsOverride: {
        offset: [0, 0],
      },
    });
  });

  test('closes the menu if the user presses escape', async () => {
    renderMenuPopover();

    expect(onClose).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('GPS location'), '10,10');
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('disables the GPS input button if there is no value', async () => {
    renderMenuPopover();

    expect(screen.getByLabelText('Jump to coordinates')).toBeDisabled();
  });

  test('enables the GPS input button if there is a value', async () => {
    renderMenuPopover();

    await user.type(screen.getByLabelText('GPS location'), '10,10');

    expect(screen.getByLabelText('Jump to coordinates')).toBeEnabled();
  });

  test('jumps to the typed coordinates by clicking the GPS input button', async () => {
    renderMenuPopover();

    await user.type(screen.getByLabelText('GPS location'), '10,10');

    expect(jumpToLocationMock).not.toHaveBeenCalled();
    expect(showPopup).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText('Jump to coordinates'));

    expect(jumpToLocationMock).toHaveBeenCalledTimes(1);
    expect(jumpToLocationMock).toHaveBeenCalledWith([10, 10]);
    expect(onClose).toHaveBeenCalledTimes(1);

    jest.runOnlyPendingTimers();

    expect(showPopup).toHaveBeenCalledTimes(1);
    expect(showPopup).toHaveBeenCalledWith('dropped-marker', {
      coordinates: [10, 10],
      location: {
        lat: 10,
        lng: 10,
      },
      popupAttrsOverride: {
        offset: [0, 0],
      },
    });
  });

  test('closes the menu if the user clicks outside', async () => {
    render(<>
      <div data-testid="outside" />

      <Provider store={mockStore(store)}>
        <MenuPopover
          buttonRef={{
            current: {
              contains: () => false,
            },
          }}
          className=""
          onClose={onClose}
        />
      </Provider>
    </>);

    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByTestId('outside'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
