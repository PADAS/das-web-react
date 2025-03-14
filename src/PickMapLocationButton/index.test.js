import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../test-utils';
import { createMapMock } from '../__test-helpers/mocks';
import { hideSideBar, showSideBar } from '../ducks/side-bar';
import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import { setIsPickingLocation } from '../ducks/map-ui';
import { setModalVisibilityState } from '../ducks/modals';

import PickMapLocationButton from './';

jest.mock('mapbox-gl', () => ({
  ...jest.requireActual('mapbox-gl'),
  Popup: class {
    addTo() {}
    on() {}
    remove() {}
    setDOMContent() {}
    setOffset() {}
    trackPointer() {}
  },
}));

jest.mock('../ducks/side-bar', () => ({
  ...jest.requireActual('../ducks/side-bar'),
  hideSideBar: jest.fn(),
  showSideBar: jest.fn(),
}));

jest.mock('../ducks/map-ui', () => ({
  ...jest.requireActual('../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
}));

jest.mock('../ducks/modals', () => ({
  ...jest.requireActual('../ducks/modals'),
  setModalVisibilityState: jest.fn(),
}));

describe('PickMapLocationButton', () => {
  const onPick = jest.fn();

  let hideSideBarMock, map, setIsPickingLocationMock, setModalVisibilityStateMock, showSideBarMock;
  beforeEach(() => {
    hideSideBarMock = jest.fn(() => () => {});
    hideSideBar.mockImplementation(hideSideBarMock);
    setIsPickingLocationMock = jest.fn(() => () => {});
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);
    setModalVisibilityStateMock = jest.fn(() => () => {});
    setModalVisibilityState.mockImplementation(setModalVisibilityStateMock);
    showSideBarMock = jest.fn(() => () => {});
    showSideBar.mockImplementation(showSideBarMock);

    map = createMapMock();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderPickMapLocationButton = (props, overrideMap = map) => render(
    <Provider store={mockStore({})}>
      <MapContext.Provider value={overrideMap}>
        <PickMapLocationButton onPick={onPick} {...props} />
      </MapContext.Provider>
    </Provider>
  );

  test('configures the button with other props', () => {
    renderPickMapLocationButton({ className: 'className' });

    expect(screen.getByLabelText('Pick a location on the map')).toHaveClass('className');
  });

  test('starts the picking location mode when the user clicks the button', () => {
    const onClick = jest.fn();
    renderPickMapLocationButton({ onClick });

    expect(setIsPickingLocation).not.toHaveBeenCalled();
    expect(setModalVisibilityState).not.toHaveBeenCalled();
    expect(hideSideBar).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Pick a location on the map'));

    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledWith(true);
    expect(setModalVisibilityState).toHaveBeenCalledTimes(1);
    expect(setModalVisibilityState).toHaveBeenCalledWith(false);
    expect(hideSideBar).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('picks a location by clicking the map', () => {
    renderPickMapLocationButton();

    userEvent.click(screen.getByLabelText('Pick a location on the map'));

    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledWith(true);
    expect(setModalVisibilityState).toHaveBeenCalledTimes(1);
    expect(setModalVisibilityState).toHaveBeenCalledWith(false);
    expect(showSideBar).not.toHaveBeenCalled();
    expect(onPick).not.toHaveBeenCalled();

    map.__test__.fireHandlers('click', { lngLat: { lng: 10.012657, lat: 11.666666 } });

    expect(setIsPickingLocation).toHaveBeenCalledTimes(2);
    expect(setIsPickingLocation).toHaveBeenCalledWith(false);
    expect(setModalVisibilityState).toHaveBeenCalledTimes(2);
    expect(setModalVisibilityState).toHaveBeenCalledWith(true);
    expect(showSideBar).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0][0].lngLat).toEqual({ lng: 10.012657, lat: 11.666666 });
  });

  test('cancels the picking operation when the user presses a key', () => {
    const onCancel = jest.fn();
    renderPickMapLocationButton({ onCancel });

    userEvent.click(screen.getByLabelText('Pick a location on the map'));

    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledWith(true);
    expect(setModalVisibilityState).toHaveBeenCalledTimes(1);
    expect(setModalVisibilityState).toHaveBeenCalledWith(false);
    expect(showSideBar).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();

    userEvent.keyboard('{Escape}');

    expect(setIsPickingLocation).toHaveBeenCalledTimes(2);
    expect(setIsPickingLocation).toHaveBeenCalledWith(false);
    expect(setModalVisibilityState).toHaveBeenCalledTimes(2);
    expect(setModalVisibilityState).toHaveBeenCalledWith(true);
    expect(showSideBar).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('renders the button content', () => {
    renderPickMapLocationButton({ renderContent: () => <div data-testid="content" /> });

    const button = screen.getByLabelText('Pick a location on the map');

    expect(within(button).getByTestId('content')).toBeVisible();
  });

  test('renders a default button content', () => {
    renderPickMapLocationButton();

    expect(screen.getByLabelText('Pick a location on the map')).toHaveTextContent('marker-feed.svg');
  });
});
