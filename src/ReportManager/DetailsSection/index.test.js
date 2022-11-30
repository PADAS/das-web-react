import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../../__test-helpers/mocks';
import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import { GPS_FORMATS } from '../../utils/location';
import { MapContext } from '../../App';
import MapDrawingToolsContextProvider, { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { mockStore } from '../../__test-helpers/MockStore';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { report } from '../../__test-helpers/fixtures/reports';
import { VALID_EVENT_GEOMETRY_TYPES } from '../../constants';

import DetailsSection from './';

let map;
const onReportedByChange = jest.fn(),
  onReportGeometryChange = jest.fn(),
  onReportLocationChange = jest.fn(),
  onReportStateChange = jest.fn();
const store = {
  data: {
    subjectStore: {},
    eventStore: {},
    eventTypes,
    patrolTypes,
    eventSchemas: {
      globalSchema: {
        properties: {
          reported_by: {
            enum_ext: [{
              value: {
                id: '1234',
                name: 'Canek',
                subject_type: 'person',
                subject_subtype: 'ranger',
                is_active: true,
                image_url: '/static/ranger-black.svg'
              }
            }],
          },
        },
      },
    }
  },
  view: {
    mapLocationSelection: { isPickingLocation: false },
    sideBar: {},
    userPreferences: { gpsFormat: GPS_FORMATS.DEG },
  },
};

describe('ReportManager - DetailsSection', () => {
  beforeEach(() => {
    jest.useFakeTimers();

    map = createMapMock();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the reported by field empty for reports without tracking subject', async () => {
    render(
      <Provider store={mockStore(store)}>
        <DetailsSection
          onReportedByChange={onReportedByChange}
          onReportGeometryChange={onReportGeometryChange}
          onReportLocationChange={onReportLocationChange}
          onReportStateChange={onReportStateChange}
          originalReport={report}
          reportForm={report}
        />
      </Provider>
    );

    const reportedBySelect = await screen.getByTestId('reportManager-reportedBySelect');

    expect(() => within(reportedBySelect).getByTestId('select-single-value')).toThrow();
    expect(within(reportedBySelect).queryByText('Reported by...')).toBeDefined();
  });

  test('shows the name of the tracking subject in reported by for saved reports', async () => {
    const reportedBy = {
      id: '1234',
      name: 'Canek',
      image_url: '/static/ranger-black.svg'
    };

    render(
      <Provider store={mockStore(store)}>
        <DetailsSection
          onReportedByChange={onReportedByChange}
          onReportGeometryChange={onReportGeometryChange}
          onReportLocationChange={onReportLocationChange}
          onReportStateChange={onReportStateChange}
          originalReport={report}
          reportForm={{ ...report, reported_by: reportedBy }}
        />
      </Provider>
    );

    const reportedBySelect = await screen.getByTestId('reportManager-reportedBySelect');
    const reportReportedInput = await within(reportedBySelect).getByTestId('select-single-value');

    const selectionImage = reportReportedInput.children[0];
    const selectionText = reportReportedInput.children[1];

    await waitFor(() => {
      expect(within(reportedBySelect).queryByText('Reported by...')).toBeNull();
      expect(selectionImage).toHaveAttribute('alt', 'Radio icon for Canek value');
      expect(selectionText).toHaveTextContent('Canek');
    });
  });

  test('triggers the onReportedByChange callback when the user selects a subject', async () => {
    const reportedBy = {
      id: '1234',
      name: 'Canek',
      image_url: '/static/ranger-black.svg'
    };

    render(
      <Provider store={mockStore(store)}>
        <DetailsSection
          onReportedByChange={onReportedByChange}
          onReportGeometryChange={onReportGeometryChange}
          onReportLocationChange={onReportLocationChange}
          onReportStateChange={onReportStateChange}
          originalReport={report}
          reportForm={{ ...report, reported_by: reportedBy }}
        />
      </Provider>
    );

    const reportedBySelect = await screen.getByTestId('reportManager-reportedBySelect');
    const reportReportedInput = await within(reportedBySelect).getByTestId('select-single-value');
    userEvent.click(reportReportedInput);

    expect(onReportedByChange).toHaveBeenCalledTimes(0);

    const reporterOption = await screen.getByAltText('Radio icon for Canek option');
    userEvent.click(reporterOption);

    expect(onReportedByChange).toHaveBeenCalledTimes(1);
    expect(onReportedByChange.mock.calls[0][0].id).toBe('1234');
  });

  test('shows the location selector if the geometry type of the report is point', async () => {
    report.location = null;

    store.data.eventTypes = eventTypes.map((eventType) => {
      if (eventType.value === report.event_type) {
        return { ...eventType, geometry_type: VALID_EVENT_GEOMETRY_TYPES.POINT };
      }
      return eventType;
    });

    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <DetailsSection
            onReportedByChange={onReportedByChange}
            onReportGeometryChange={onReportGeometryChange}
            onReportLocationChange={onReportLocationChange}
            onReportStateChange={onReportStateChange}
            originalReport={report}
            reportForm={report}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    );

    expect((await screen.findByText('Click here to set location'))).toBeDefined();
  });

  test('triggers the onReportLocationChange callback when the user chooses a location in map', async () => {
    store.data.eventTypes = eventTypes.map((eventType) => {
      if (eventType.value === report.event_type) {
        return { ...eventType, geometry_type: VALID_EVENT_GEOMETRY_TYPES.POINT };
      }
      return eventType;
    });

    render(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <DetailsSection
              onReportedByChange={onReportedByChange}
              onReportGeometryChange={onReportGeometryChange}
              onReportLocationChange={onReportLocationChange}
              onReportStateChange={onReportStateChange}
              originalReport={report}
              reportForm={report}
            />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      </Provider>
    );

    const setLocationButton = await screen.findByTestId('set-location-button');
    userEvent.click(setLocationButton);
    const placeMarkerOnMapButton = await screen.findByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    expect(onReportLocationChange).toHaveBeenCalledTimes(0);

    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });

    expect(onReportLocationChange).toHaveBeenCalledTimes(1);
    expect(onReportLocationChange).toHaveBeenCalledWith([88, 55]);
  });

  test('shows the area selector if the geometry type of the report is polygon', async () => {
    store.data.eventTypes = eventTypes.map((eventType) => {
      if (eventType.value === report.event_type) {
        return { ...eventType, geometry_type: VALID_EVENT_GEOMETRY_TYPES.POLYGON };
      }
      return eventType;
    });

    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <DetailsSection
            onReportedByChange={onReportedByChange}
            onReportGeometryChange={onReportGeometryChange}
            onReportLocationChange={onReportLocationChange}
            onReportStateChange={onReportStateChange}
            originalReport={report}
            reportForm={report}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    );

    expect((await screen.findByText('Set report area'))).toBeDefined();
  });

  test('triggers the onReportGeometryChange callback when redux state suggests a geometry selection', async () => {
    store.data.eventTypes = eventTypes.map((eventType) => {
      if (eventType.value === report.event_type) {
        return { ...eventType, geometry_type: VALID_EVENT_GEOMETRY_TYPES.POLYGON };
      }
      return eventType;
    });

    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider value={{ mapDrawingData: {}, setMapDrawingData: jest.fn() }}>
          <DetailsSection
            onReportedByChange={onReportedByChange}
            onReportGeometryChange={onReportGeometryChange}
            onReportLocationChange={onReportLocationChange}
            onReportStateChange={onReportStateChange}
            originalReport={report}
            reportForm={report}
          />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );

    expect(onReportGeometryChange).toHaveBeenCalledTimes(1);
  });

  test('triggers the onReportStateChange callback when user selects a new state', async () => {
    store.data.eventTypes = eventTypes;

    render(
      <Provider store={mockStore(store)}>
        <DetailsSection
          onReportedByChange={onReportedByChange}
          onReportGeometryChange={onReportGeometryChange}
          onReportLocationChange={onReportLocationChange}
          onReportStateChange={onReportStateChange}
          originalReport={report}
          reportForm={report}
        />
      </Provider>
    );

    const stateDropdown = await screen.findByText('Active');
    userEvent.click(stateDropdown);

    expect(onReportStateChange).toHaveBeenCalledTimes(0);

    const resolvedItem = await screen.findByText('Resolved');
    userEvent.click(resolvedItem);

    expect(onReportStateChange).toHaveBeenCalledTimes(1);
    expect(onReportStateChange.mock.calls[0][0]).toBe('resolved');
  });
});
