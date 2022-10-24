import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { MapContext } from '../../App';
import MapDrawingToolsContextProvider, { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import AreaSelectorInput from './';
import { createMapMock } from '../../__test-helpers/mocks';
import { mockStore } from '../../__test-helpers/MockStore';
import { eventsWithGeometries } from '../../__test-helpers/fixtures/events';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import { setIsPickingLocation } from '../../ducks/map-ui';
import { hideSideBar, showSideBar } from '../../ducks/side-bar';
import { setModalVisibilityState } from '../../ducks/modals';

import { FormDataContext } from '../../EditableItem/context';

const [, eventWithPolygon] = eventsWithGeometries;

const CONTROL_SELECTOR = 'set-geometry-button';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/reports' }),
}));


jest.mock('../../ducks/side-bar', () => ({
  ...jest.requireActual('../../ducks/side-bar'),
  hideSideBar: jest.fn(),
  showSideBar: jest.fn(),
}));

jest.mock('../../ducks/modals', () => ({
  ...jest.requireActual('../../ducks/modals'),
  setModalVisibilityState: jest.fn(),
}));

jest.mock('../../ducks/map-ui', () => ({
  ...jest.requireActual('../../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
}));

const geometryExample = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [6.657425, 9.301125],
        [-40.668725, 5.047775],
        [5.0602, -13.74975]
      ]
    ]
  }
};

describe('The AreaSelector input', () => {

  let store, map, onGeometryChange, hideSideBarMock, report,
    setModalVisibilityStateMock, showSideBarMock, setIsPickingLocationMock;

  beforeEach(() => {
    hideSideBarMock = jest.fn(() => () => {});
    hideSideBar.mockImplementation(hideSideBarMock);
    setModalVisibilityStateMock = jest.fn(() => () => {});
    setModalVisibilityState.mockImplementation(setModalVisibilityStateMock);
    showSideBarMock = jest.fn(() => () => {});
    showSideBar.mockImplementation(showSideBarMock);
    setIsPickingLocationMock = jest.fn(() => () => {});
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);
    map = createMapMock();
    report = eventWithPolygon;

    store = {
      view: {
        mapLocationSelection: { event: report, isPickingLocation: false },
        userPreferences: {},
      },
      data: {
        eventType: [],
        eventStore: {
          [report.id]: report,
        }
      },
    };
    onGeometryChange = jest.fn();

  });

  describe('with no area provided', () => {
    const withNoGeo = { id: 'whatever', geometry: null };

    test('starts picking an area on the map as soon as it\'s open', async () => {

      render(
        <Provider store={mockStore(store)}>
          <NavigationWrapper>
            <FormDataContext.Provider value={{}}>
              <MapDrawingToolsContextProvider>
                <MapContext.Provider value={map}>
                  <AreaSelectorInput
                    event={withNoGeo}
                    originalEvent={withNoGeo}
                    map={map}
                    onGeometryChange={onGeometryChange}
              />
                </MapContext.Provider>
              </MapDrawingToolsContextProvider>
            </FormDataContext.Provider>
          </NavigationWrapper>
        </Provider>
      );

      expect(setIsPickingLocation).toHaveBeenCalledTimes(0);

      const setAreaButton = await screen.getByTestId(CONTROL_SELECTOR);
      userEvent.click(setAreaButton);

      await waitFor(() => {
        expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
      });
    });

    test('renders the placeholder default value for area', async () => {
      render(
        <Provider store={mockStore(store)}>
          <NavigationWrapper>
            <FormDataContext.Provider value={{}}>
              <MapDrawingToolsContextProvider>
                <MapContext.Provider value={map}>
                  <AreaSelectorInput
                    event={withNoGeo}
                    originalEvent={withNoGeo}
                    map={map}
                    onGeometryChange={onGeometryChange}

              />
                </MapContext.Provider>
              </MapDrawingToolsContextProvider>
            </FormDataContext.Provider>
          </NavigationWrapper>
        </Provider>
      );

      expect((await screen.findByText('Set report area'))).toBeDefined();
      expect((await screen.findByText('polygon.svg'))).toBeDefined();
    });
  });

  describe('with an area provided', () => {

    test('deletes the report area if user clicks delete area button', async () => {
      report.geometry = geometryExample;

      render(
        <Provider store={mockStore(store)}>
          <NavigationWrapper>
            <FormDataContext.Provider value={report}>
              <MapDrawingToolsContextProvider>
                <MapContext.Provider value={map}>
                  <AreaSelectorInput
                    event={report}
                    originalEvent={report}
                    map={map}
                    onGeometryChange={onGeometryChange}
            />
                </MapContext.Provider>
              </MapDrawingToolsContextProvider>
            </FormDataContext.Provider>
          </NavigationWrapper>
        </Provider>
      );

      const setAreaButton = await screen.getByTestId(CONTROL_SELECTOR);
      userEvent.click(setAreaButton);

      expect(onGeometryChange).toHaveBeenCalledTimes(0);

      const deleteAreaButton = await screen.getByTitle('Delete area button');
      userEvent.click(deleteAreaButton);

      await waitFor(async () => {
        expect(onGeometryChange).toHaveBeenCalledTimes(1);
        expect(onGeometryChange).toHaveBeenCalledWith(null);
        expect((await screen.queryByRole('tooltip'))).toBeNull();
      });
    });

    test('saving a new report area adds the provenance property', async () => {
      const fillPolygon = { type: 'Feature' };
      const setMapDrawingData = jest.fn();

      render(
        <Provider store={mockStore(store)}>
          <NavigationWrapper>
            <FormDataContext.Provider value={report}>
              <MapDrawingToolsContext.Provider value={{ mapDrawingData: { fillPolygon }, setMapDrawingData }}>
                <MapContext.Provider value={map}>
                  <AreaSelectorInput
                    map={map}
                    onGeometryChange={onGeometryChange}
                  />
                </MapContext.Provider>
              </MapDrawingToolsContext.Provider>
            </FormDataContext.Provider>
          </NavigationWrapper>
        </Provider>
      );

      expect(onGeometryChange).toHaveBeenCalledTimes(1);
      expect(onGeometryChange).toHaveBeenCalledWith({
        ...fillPolygon,
        properties: { provenance: 'web' },
      });
      expect(setMapDrawingData).toHaveBeenCalledTimes(1);
      expect(setMapDrawingData).toHaveBeenCalledWith(null);
    });

    test('saving an existing report area keeps the provenance property', async () => {
      const fillPolygon = { type: 'Feature', properties: { provenance: 'mobile' } };
      const setMapDrawingData = jest.fn();

      render(
        <Provider store={mockStore(store)}>
          <NavigationWrapper>
            <FormDataContext.Provider value={report}>
              <MapDrawingToolsContext.Provider value={{ mapDrawingData: { fillPolygon }, setMapDrawingData }}>
                <MapContext.Provider value={map}>
                  <AreaSelectorInput
                    event={{
                      ...report,
                      geometry: fillPolygon,
                    }}
                    map={map}
                    onGeometryChange={onGeometryChange}
                  />
                </MapContext.Provider>
              </MapDrawingToolsContext.Provider>
            </FormDataContext.Provider>
          </NavigationWrapper>
        </Provider>
      );

      expect(onGeometryChange).toHaveBeenCalledTimes(1);
      expect(onGeometryChange).toHaveBeenCalledWith(fillPolygon);
      expect(setMapDrawingData).toHaveBeenCalledTimes(1);
      expect(setMapDrawingData).toHaveBeenCalledWith(null);
    });
  });

});