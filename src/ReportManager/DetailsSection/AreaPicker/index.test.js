import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen, waitFor } from '../../../test-utils';
import { eventsWithGeometries } from '../../../__test-helpers/fixtures/events';
import { hideSideBar, showSideBar } from '../../../ducks/side-bar';
import { MAP_LOCATION_SELECTION_MODES } from '../../../ducks/map-ui';
import MapDrawingToolsContextProvider, { MapDrawingToolsContext } from '../../../MapDrawingTools/ContextProvider';
import { mockStore } from '../../../__test-helpers/MockStore';
import { setIsPickingLocation, setMapLocationSelectionEvent } from '../../../ducks/map-ui';
import { setModalVisibilityState } from '../../../ducks/modals';

import AreaPicker from './';

jest.mock('../../../ducks/side-bar', () => ({
  ...jest.requireActual('../../../ducks/side-bar'),
  hideSideBar: jest.fn(),
  showSideBar: jest.fn(),
}));

jest.mock('../../../ducks/map-ui', () => ({
  ...jest.requireActual('../../../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
  setMapLocationSelectionEvent: jest.fn(),
}));

jest.mock('../../../ducks/modals', () => ({
  ...jest.requireActual('../../../ducks/modals'),
  setModalVisibilityState: jest.fn(),
}));

describe('AreaPicker', () => {
  const onChange = jest.fn();

  let event, store;
  beforeEach(() => {
    hideSideBar.mockImplementation(() => () => {});
    showSideBar.mockImplementation(() => () => {});
    setIsPickingLocation.mockImplementation(() => () => {});
    setMapLocationSelectionEvent.mockImplementation(() => () => {});
    setModalVisibilityState.mockImplementation(() => () => {});

    event = { ...eventsWithGeometries[1] };

    store = {
      data: {
        eventStore: {
          [event.id]: event,
        },
      },
      view: {
        mapLocationSelection: {
          isPickingLocation: false,
          mode: MAP_LOCATION_SELECTION_MODES.DEFAULT,
        },
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderAreaPicker = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <MapDrawingToolsContextProvider>
        <AreaPicker
          data-testid="areaPicker"
          event={event}
          id="areaPicker"
          onChange={onChange}
          value={event.geometry}
          {...props}
        />
      </MapDrawingToolsContextProvider>
    </Provider>
  );

  test('adds a custom class name', async () => {
    renderAreaPicker({ className: 'className' });

    expect(screen.getByTestId('areaPicker')).toHaveClass('className');
  });

  test('does not disable the area picker', async () => {
    renderAreaPicker();

    expect(screen.getByTestId('areaPicker')).not.toHaveClass('disabled');
    expect(screen.getByRole('button', { name: 'Open the area picker menu' })).not.toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Area' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Copy area GeoJSON to clipboard' })).not.toBeDisabled();
  });

  test('disables the area picker', async () => {
    renderAreaPicker({ disabled: true });

    expect(screen.getByTestId('areaPicker')).toHaveClass('disabled');
    expect(screen.getByRole('button', { name: 'Open the area picker menu' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Area' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Copy area GeoJSON to clipboard' })).toBeDisabled();
  });

  test('does not show an error state', async () => {
    renderAreaPicker();

    expect(screen.getByTestId('areaPicker')).not.toHaveClass('error');
  });

  test('shows an error state', async () => {
    renderAreaPicker({
      inputProps: {
        'aria-invalid': true,
      },
    });

    expect(screen.getByTestId('areaPicker')).toHaveClass('error');
  });

  test('sets the name to an input with the area picker GeoJSON value', async () => {
    renderAreaPicker({ name: 'area-picker-name' });

    const areaPickerInput = screen.getByTestId('areaPicker-input');

    expect(areaPickerInput).toHaveAttribute('name', 'area-picker-name');
    expect(areaPickerInput)
      .toHaveValue('{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[58.31891231904782,-32.95903350246844],[58.47630823380208,-32.59422031588628],[58.62248893060512,-32.69629040415761],[57.291173483506896,-33.91600187660145],[56.81251637929487,-33.02717890265869],[58.31891231904782,-32.95903350246844]]]}}]}');
  });

  test('blurs the area picker', async () => {
    const onBlur = jest.fn();

    renderAreaPicker({ onBlur });

    const areaPicker = screen.getByTestId('areaPicker');
    await userEvent.click(areaPicker);

    expect(onBlur).not.toHaveBeenCalled();

    fireEvent.blur(areaPicker);

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('focuses the area picker when focusing one of the inner elements', async () => {
    const onFocus = jest.fn();

    renderAreaPicker({ onFocus });

    expect(onFocus).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Open the area picker menu' }));

    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  test('shows a default placeholder', async () => {
    renderAreaPicker();

    expect(screen.getByRole('textbox', { name: 'Area' })).toHaveAttribute('placeholder', 'Set Event Area');
  });

  test('shows a custom placeholder', async () => {
    renderAreaPicker({ placeholder: 'placeholder' });

    expect(screen.getByRole('textbox', { name: 'Area' })).toHaveAttribute('placeholder', 'placeholder');
  });

  test('does not set the area picker as read only', async () => {
    renderAreaPicker();

    const setAreaButton = screen.getByRole('button', { name: 'Open the area picker menu' });

    expect(setAreaButton).not.toHaveClass('readOnly');
    expect(setAreaButton).not.toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Area' })).not.toHaveClass('readOnly');
  });

  test('sets the area picker as read only', async () => {
    renderAreaPicker({ readOnly: true });

    const setAreaButton = screen.getByRole('button', { name: 'Open the area picker menu' });

    expect(setAreaButton).toHaveClass('readOnly');
    expect(setAreaButton).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Area' })).toHaveClass('readOnly');
  });

  test('does not set the area picker as required', async () => {
    renderAreaPicker();

    expect(screen.getByRole('textbox', { name: 'Area' })).not.toBeRequired();
  });

  test('sets the area picker as required', async () => {
    renderAreaPicker({ required: true });

    expect(screen.getByRole('textbox', { name: 'Area' })).toBeRequired();
  });

  test('forwards the focusing of the input to the set area button', async () => {
    renderAreaPicker();

    fireEvent.focus(screen.getByRole('textbox', { name: 'Area' }));

    expect(screen.getByRole('button', { name: 'Open the area picker menu' })).toHaveFocus();
  });

  test('shows an empty value in the input if there is not a value', async () => {
    renderAreaPicker({ value: null });

    expect(screen.getByRole('textbox', { name: 'Area' })).toHaveValue('');
  });

  test('shows a display value in the input if there is a value', async () => {
    renderAreaPicker();

    expect(screen.getByRole('textbox', { name: 'Area' })).toHaveValue('7530.52km² area, 493.54km perimeter');
  });

  test('does not show a text copy button if there is no value yet', async () => {
    renderAreaPicker({ value: null });

    expect(screen.queryByRole('button', { name: 'Copy area GeoJSON to clipboard' })).toBeNull();
  });

  test('shows a text copy button if there is a value', async () => {
    renderAreaPicker();

    expect(screen.getByRole('button', { name: 'Copy area GeoJSON to clipboard' })).toBeVisible();
  });

  test('picks an area when clicking the set area button if there is not a value', async () => {
    renderAreaPicker({ value: null });

    const setAreaButton = screen.getByRole('button', { name: 'Create area on the map' });

    expect(setMapLocationSelectionEvent).not.toHaveBeenCalled();
    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setModalVisibilityState).toHaveBeenCalledTimes(1);
    expect(hideSideBar).not.toHaveBeenCalled();

    await userEvent.click(setAreaButton);

    expect(setMapLocationSelectionEvent).toHaveBeenCalledTimes(1);
    expect(setMapLocationSelectionEvent).toHaveBeenCalledWith(event);
    expect(setIsPickingLocation).toHaveBeenCalledTimes(2);
    expect(setIsPickingLocation).toHaveBeenCalledWith(true, MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY);
    expect(setModalVisibilityState).toHaveBeenCalledTimes(2);
    expect(setModalVisibilityState).toHaveBeenCalledWith(false);
    expect(hideSideBar).toHaveBeenCalledTimes(1);
  });

  test('opens the menu popover when clicking the set area button if there is a value already', async () => {
    renderAreaPicker();

    const setAreaButton = screen.getByRole('button', { name: 'Open the area picker menu' });

    expect(screen.queryByRole('dialog', { name: 'Area' })).toBeNull();
    expect(setAreaButton).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(setAreaButton);

    expect(screen.getByRole('dialog', { name: 'Area' })).toBeVisible();
    expect(setAreaButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('closes the menu popover', async () => {
    renderAreaPicker();

    const setAreaButton = screen.getByRole('button', { name: 'Open the area picker menu' });
    await userEvent.click(setAreaButton);
    const menuPopover = screen.getByRole('dialog', { name: 'Area' });

    expect(menuPopover).toBeVisible();
    expect(setAreaButton).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(setAreaButton);

    expect(setAreaButton).toHaveAttribute('aria-expanded', 'false');

    await waitFor(() => {
      expect(menuPopover).not.toBeVisible();
    });
  });

  test('picks an area from the area picker menu', async () => {
    renderAreaPicker();

    await userEvent.click(screen.getByRole('button', { name: 'Open the area picker menu' }));

    expect(setMapLocationSelectionEvent).not.toHaveBeenCalled();
    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setModalVisibilityState).toHaveBeenCalledTimes(1);
    expect(hideSideBar).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Edit area on the map' }));

    expect(setMapLocationSelectionEvent).toHaveBeenCalledTimes(1);
    expect(setMapLocationSelectionEvent).toHaveBeenCalledWith(event);
    expect(setIsPickingLocation).toHaveBeenCalledTimes(2);
    expect(setIsPickingLocation).toHaveBeenCalledWith(true, MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY);
    expect(setModalVisibilityState).toHaveBeenCalledTimes(2);
    expect(setModalVisibilityState).toHaveBeenCalledWith(false);
    expect(hideSideBar).toHaveBeenCalledTimes(1);
  });

  test('updates the value once the user finishes drawing a new area', async () => {
    const setMapDrawingData = jest.fn();
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider
          value={{
            mapDrawingData: {
              fillPolygon: {
                geometry: {
                  type: 'Polygon',
                  coordinates: []
                },
                type: 'Feature',
              },
            },
            setMapDrawingData,
          }}>
          <AreaPicker
            data-testid="areaPicker"
            event={event}
            id="areaPicker"
            onChange={onChange}
            value={null}
          />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );

    expect(setMapDrawingData).toHaveBeenCalledTimes(1);
    expect(setMapDrawingData).toHaveBeenCalledWith(null);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      geometry: {
        type: 'Polygon',
        coordinates: []
      },
      properties: {
        provenance: 'web',
      },
      type: 'Feature',
    });
  });

  test('updates the value once the user finishes editing an existing area', async () => {
    const setMapDrawingData = jest.fn();
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider
          value={{
            mapDrawingData: {
              fillPolygon: {
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [1, 1],
                      [2, 2],
                      [1, 2],
                      [1, 1],
                    ]
                  ]
                },
                type: 'Feature',
              },
            },
            setMapDrawingData,
          }}>
          <AreaPicker
            data-testid="areaPicker"
            event={event}
            id="areaPicker"
            onChange={onChange}
            value={{
              properties: {
                provenance: 'mobile',
              },
              type: 'Feature',
            }}
          />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );

    expect(setMapDrawingData).toHaveBeenCalledTimes(1);
    expect(setMapDrawingData).toHaveBeenCalledWith(null);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [1, 1],
            [2, 2],
            [1, 2],
            [1, 1],
          ]
        ]
      },
      properties: {
        provenance: 'mobile',
      },
      type: 'Feature',
    });
  });

  test('turns off the show map mode automatically when user is not drawing a geometry', async () => {
    renderAreaPicker();

    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledWith(false, MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY);
    expect(setModalVisibilityState).toHaveBeenCalledTimes(1);
    expect(setModalVisibilityState).toHaveBeenCalledWith(true);
    expect(showSideBar).toHaveBeenCalled();
  });
});
