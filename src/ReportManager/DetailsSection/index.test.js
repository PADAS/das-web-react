import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../../__test-helpers/mocks';
import { eventSchemas } from '../../__test-helpers/fixtures/event-schemas';
import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import { GPS_FORMATS } from '../../utils/location';
import { formValidator } from '../../utils/events';
import { MapContext } from '../../App';
import MapDrawingToolsContextProvider, { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { mockStore } from '../../__test-helpers/MockStore';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { render, screen, waitFor, within } from '../../test-utils';
import { report } from '../../__test-helpers/fixtures/reports';
import { VALID_EVENT_GEOMETRY_TYPES } from '../../constants';

import DetailsSection from './';

let map;
const onFormChange = jest.fn(),
  onFormError = jest.fn(),
  onFormSubmit = jest.fn(),
  onReportedByChange = jest.fn(),
  onReportDateChange = jest.fn(),
  onReportGeometryChange = jest.fn(),
  onReportLocationChange = jest.fn(),
  onReportStateChange = jest.fn(),
  onReportTimeChange = jest.fn();
const store = {
  data: {
    subjectStore: {},
    eventStore: {},
    eventTypes,
    patrolTypes,
    eventSchemas,
  },
  view: {
    mapLocationSelection: { isPickingLocation: false },
    sideBar: {},
    userPreferences: { gpsFormat: GPS_FORMATS.DEG },
  },
};

describe('ReportManager - DetailsSection', () => {
  eventSchemas.globalSchema.properties.reported_by.enum_ext[0].value = {
    id: '1234',
    name: 'Canek',
    subject_type: 'person',
    subject_subtype: 'ranger',
    is_active: true,
    image_url: '/static/ranger-black.svg'
  };

  const reportedBy = {
    id: '1234',
    name: 'Canek',
    image_url: '/static/ranger-black.svg'
  };

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
          formSchema={eventSchemas.accident_rep.base.schema}
          formUISchema={eventSchemas.accident_rep.base.uiSchema}
          isCollection={false}
          loadingSchema={false}
          onFormChange={onFormChange}
          onFormError={onFormError}
          onFormSubmit={onFormSubmit}
          onReportedByChange={onReportedByChange}
          onReportDateChange={onReportDateChange}
          onReportGeometryChange={onReportGeometryChange}
          onReportLocationChange={onReportLocationChange}
          onReportStateChange={onReportStateChange}
          onReportTimeChange={onReportTimeChange}
          originalReport={report}
          reportForm={report}
          formValidator={formValidator}
        />
      </Provider>
    );

    const reportedBySelect = await screen.getByTestId('reportManager-reportedBySelect');

    expect(() => within(reportedBySelect).getByTestId('select-single-value')).toThrow();
    expect(within(reportedBySelect).queryByText('Reported by...')).toBeDefined();
  });

  test('shows the name of the tracking subject in reported by for saved reports', async () => {
    render(
      <Provider store={mockStore(store)}>
        <DetailsSection
          formSchema={eventSchemas.accident_rep.base.schema}
          formUISchema={eventSchemas.accident_rep.base.uiSchema}
          isCollection={false}
          loadingSchema={false}
          onFormChange={onFormChange}
          onFormError={onFormError}
          onFormSubmit={onFormSubmit}
          onReportedByChange={onReportedByChange}
          onReportDateChange={onReportDateChange}
          onReportGeometryChange={onReportGeometryChange}
          onReportLocationChange={onReportLocationChange}
          onReportStateChange={onReportStateChange}
          onReportTimeChange={onReportTimeChange}
          originalReport={report}
          reportForm={{ ...report, reported_by: reportedBy }}
          formValidator={formValidator}
        />
      </Provider>
    );

    const reportedBySelect = await screen.getByTestId('reportManager-reportedBySelect');
    const selectionImage = await screen.getByAltText('Radio icon for Canek value');

    await waitFor(async () => {
      expect(within(reportedBySelect).queryByText('Reported by...')).toBeNull();
      expect(selectionImage).toHaveAttribute('src', 'https://localhost//static/ranger-black.svg');
      expect((await within(reportedBySelect).findByText('Canek'))).toBeDefined();
    });
  });

  test('does not show the reported by field if report is collection', async () => {
    render(
      <Provider store={mockStore(store)}>
        <DetailsSection
          formSchema={eventSchemas.accident_rep.base.schema}
          formUISchema={eventSchemas.accident_rep.base.uiSchema}
          isCollection
          loadingSchema={false}
          onFormChange={onFormChange}
          onFormError={onFormError}
          onFormSubmit={onFormSubmit}
          onReportedByChange={onReportedByChange}
          onReportDateChange={onReportDateChange}
          onReportGeometryChange={onReportGeometryChange}
          onReportLocationChange={onReportLocationChange}
          onReportStateChange={onReportStateChange}
          onReportTimeChange={onReportTimeChange}
          originalReport={report}
          reportForm={report}
          formValidator={formValidator}
        />
      </Provider>
    );

    expect((await screen.queryByTestId('reportManager-reportedBySelect'))).toBeNull();
  });

  test('triggers the onReportedByChange callback when the user selects a subject', async () => {
    render(
      <Provider store={mockStore(store)}>
        <DetailsSection
          formSchema={eventSchemas.accident_rep.base.schema}
          formUISchema={eventSchemas.accident_rep.base.uiSchema}
          isCollection={false}
          loadingSchema={false}
          onFormChange={onFormChange}
          onFormError={onFormError}
          onFormSubmit={onFormSubmit}
          onReportedByChange={onReportedByChange}
          onReportDateChange={onReportDateChange}
          onReportGeometryChange={onReportGeometryChange}
          onReportLocationChange={onReportLocationChange}
          onReportStateChange={onReportStateChange}
          onReportTimeChange={onReportTimeChange}
          originalReport={report}
          reportForm={{ ...report, reported_by: reportedBy }}
          formValidator={formValidator}
        />
      </Provider>
    );

    const selectionImage = await screen.getByAltText('Radio icon for Canek value');
    userEvent.click(selectionImage);

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
            formSchema={eventSchemas.accident_rep.base.schema}
            formUISchema={eventSchemas.accident_rep.base.uiSchema}
            isCollection={false}
            loadingSchema={false}
            onFormChange={onFormChange}
            onFormError={onFormError}
            onFormSubmit={onFormSubmit}
            onReportedByChange={onReportedByChange}
            onReportDateChange={onReportDateChange}
            onReportGeometryChange={onReportGeometryChange}
            onReportLocationChange={onReportLocationChange}
            onReportStateChange={onReportStateChange}
            onReportTimeChange={onReportTimeChange}
            originalReport={report}
            reportForm={report}
            formValidator={formValidator}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    );

    expect((await screen.findByText('Set location'))).toBeDefined();
  });

  test('does not show the location selector if report is collection', async () => {
    render(
      <Provider store={mockStore(store)}>
        <DetailsSection
          formSchema={eventSchemas.accident_rep.base.schema}
          formUISchema={eventSchemas.accident_rep.base.uiSchema}
          isCollection
          loadingSchema={false}
          onFormChange={onFormChange}
          onFormError={onFormError}
          onFormSubmit={onFormSubmit}
          onReportedByChange={onReportedByChange}
          onReportDateChange={onReportDateChange}
          onReportGeometryChange={onReportGeometryChange}
          onReportLocationChange={onReportLocationChange}
          onReportStateChange={onReportStateChange}
          onReportTimeChange={onReportTimeChange}
          originalReport={report}
          reportForm={report}
          formValidator={formValidator}
        />
      </Provider>
    );

    expect((await screen.queryByText('Set location'))).toBeNull();
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
              formSchema={eventSchemas.accident_rep.base.schema}
              formUISchema={eventSchemas.accident_rep.base.uiSchema}
              isCollection={false}
              loadingSchema={false}
              onFormChange={onFormChange}
              onFormError={onFormError}
              onFormSubmit={onFormSubmit}
              onReportedByChange={onReportedByChange}
              onReportDateChange={onReportDateChange}
              onReportGeometryChange={onReportGeometryChange}
              onReportLocationChange={onReportLocationChange}
              onReportStateChange={onReportStateChange}
              onReportTimeChange={onReportTimeChange}
              originalReport={report}
              reportForm={report}
              formValidator={formValidator}
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
            formSchema={eventSchemas.accident_rep.base.schema}
            formUISchema={eventSchemas.accident_rep.base.uiSchema}
            isCollection={false}
            loadingSchema={false}
            onFormChange={onFormChange}
            onFormError={onFormError}
            onFormSubmit={onFormSubmit}
            onReportedByChange={onReportedByChange}
            onReportDateChange={onReportDateChange}
            onReportGeometryChange={onReportGeometryChange}
            onReportLocationChange={onReportLocationChange}
            onReportStateChange={onReportStateChange}
            onReportTimeChange={onReportTimeChange}
            originalReport={report}
            reportForm={report}
            formValidator={formValidator}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    );

    expect((await screen.findByText('Set event area'))).toBeDefined();
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
            formSchema={eventSchemas.accident_rep.base.schema}
            formUISchema={eventSchemas.accident_rep.base.uiSchema}
            isCollection={false}
            loadingSchema={false}
            onFormChange={onFormChange}
            onFormError={onFormError}
            onFormSubmit={onFormSubmit}
            onReportedByChange={onReportedByChange}
            onReportDateChange={onReportDateChange}
            onReportGeometryChange={onReportGeometryChange}
            onReportLocationChange={onReportLocationChange}
            onReportStateChange={onReportStateChange}
            onReportTimeChange={onReportTimeChange}
            originalReport={report}
            reportForm={report}
            formValidator={formValidator}
          />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );

    expect(onReportGeometryChange).toHaveBeenCalledTimes(1);
  });

  test('does not show the date selector if report is collection', async () => {
    render(
      <Provider store={mockStore(store)}>
        <DetailsSection
          formSchema={eventSchemas.accident_rep.base.schema}
          formUISchema={eventSchemas.accident_rep.base.uiSchema}
          isCollection
          loadingSchema={false}
          onFormChange={onFormChange}
          onFormError={onFormError}
          onFormSubmit={onFormSubmit}
          onReportedByChange={onReportedByChange}
          onReportDateChange={onReportDateChange}
          onReportGeometryChange={onReportGeometryChange}
          onReportLocationChange={onReportLocationChange}
          onReportStateChange={onReportStateChange}
          onReportTimeChange={onReportTimeChange}
          originalReport={report}
          reportForm={report}
          formValidator={formValidator}
        />
      </Provider>
    );

    expect((await screen.queryByTestId('datePicker-input'))).toBeNull();
  });

  test('triggers the onReportDateChange callback when the user selects a date', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <DetailsSection
              formSchema={eventSchemas.accident_rep.base.schema}
              formUISchema={eventSchemas.accident_rep.base.uiSchema}
              isCollection={false}
              loadingSchema={false}
              onFormChange={onFormChange}
              onFormError={onFormError}
              onFormSubmit={onFormSubmit}
              onReportedByChange={onReportedByChange}
              onReportDateChange={onReportDateChange}
              onReportGeometryChange={onReportGeometryChange}
              onReportLocationChange={onReportLocationChange}
              onReportStateChange={onReportStateChange}
              onReportTimeChange={onReportTimeChange}
              originalReport={report}
              reportForm={report}
              formValidator={formValidator}
            />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      </Provider>
    );

    const datePickerInput = await screen.findByTestId('datePicker-input');
    userEvent.click(datePickerInput);

    expect(onReportDateChange).toHaveBeenCalledTimes(0);

    const options = await screen.findAllByRole('option');
    userEvent.click(options[16]);

    expect(onReportDateChange).toHaveBeenCalledTimes(1);
    expect(onReportDateChange.mock.calls[0][0].toISOString()).toMatch(/^2022-04-12/);
  });

  test('does not show the time selector if report is collection', async () => {
    render(
      <Provider store={mockStore(store)}>
        <DetailsSection
          formSchema={eventSchemas.accident_rep.base.schema}
          formUISchema={eventSchemas.accident_rep.base.uiSchema}
          isCollection
          loadingSchema={false}
          onFormChange={onFormChange}
          onFormError={onFormError}
          onFormSubmit={onFormSubmit}
          onReportedByChange={onReportedByChange}
          onReportDateChange={onReportDateChange}
          onReportGeometryChange={onReportGeometryChange}
          onReportLocationChange={onReportLocationChange}
          onReportStateChange={onReportStateChange}
          onReportTimeChange={onReportTimeChange}
          originalReport={report}
          reportForm={report}
          formValidator={formValidator}
        />
      </Provider>
    );

    expect((await screen.queryByTestId('time-input'))).toBeNull();
  });

  test('triggers the onReportTimeChange callback when the user selects a time', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <DetailsSection
              formSchema={eventSchemas.accident_rep.base.schema}
              formUISchema={eventSchemas.accident_rep.base.uiSchema}
              isCollection={false}
              loadingSchema={false}
              onFormChange={onFormChange}
              onFormError={onFormError}
              onFormSubmit={onFormSubmit}
              onReportedByChange={onReportedByChange}
              onReportDateChange={onReportDateChange}
              onReportGeometryChange={onReportGeometryChange}
              onReportLocationChange={onReportLocationChange}
              onReportStateChange={onReportStateChange}
              onReportTimeChange={onReportTimeChange}
              originalReport={report}
              reportForm={report}
              formValidator={formValidator}
            />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      </Provider>
    );

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    const optionsList = await screen.findByTestId('timePicker-OptionsList');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

    expect(onReportTimeChange).toHaveBeenCalledTimes(0);

    userEvent.click(timeOptionsListItems[2]);

    expect(onReportTimeChange).toHaveBeenCalledTimes(1);
  });

  test('does not show the printable row with the geometry preview if report does not have a geometry', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <DetailsSection
              formSchema={eventSchemas.accident_rep.base.schema}
              formUISchema={eventSchemas.accident_rep.base.uiSchema}
              isCollection={false}
              loadingSchema={false}
              onFormChange={onFormChange}
              onFormError={onFormError}
              onFormSubmit={onFormSubmit}
              onReportedByChange={onReportedByChange}
              onReportDateChange={onReportDateChange}
              onReportGeometryChange={onReportGeometryChange}
              onReportLocationChange={onReportLocationChange}
              onReportStateChange={onReportStateChange}
              onReportTimeChange={onReportTimeChange}
              originalReport={report}
              reportForm={report}
              formValidator={formValidator}
            />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      </Provider>
    );

    expect((await screen.queryByAltText('Static map with geometry'))).toBeNull();
  });

  test('shows the printable row with the geometry preview if report has a geometry', async () => {
    report.geometry = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [6.657425, 9.301125],
            [-40.668725, 5.047775],
            [5.0602, -13.74975],
            [6.657425, 9.301125],
          ]
        ]
      },
    };

    store.data.eventTypes = eventTypes.map((eventType) => {
      if (eventType.value === report.event_type) {
        return { ...eventType, geometry_type: VALID_EVENT_GEOMETRY_TYPES.POLYGON };
      }
      return eventType;
    });

    render(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <DetailsSection
              formSchema={eventSchemas.accident_rep.base.schema}
              formUISchema={eventSchemas.accident_rep.base.uiSchema}
              isCollection={false}
              loadingSchema={false}
              onFormChange={onFormChange}
              onFormError={onFormError}
              onFormSubmit={onFormSubmit}
              onReportedByChange={onReportedByChange}
              onReportDateChange={onReportDateChange}
              onReportGeometryChange={onReportGeometryChange}
              onReportLocationChange={onReportLocationChange}
              onReportStateChange={onReportStateChange}
              onReportTimeChange={onReportTimeChange}
              originalReport={report}
              reportForm={report}
              formValidator={formValidator}
            />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      </Provider>
    );

    expect((await screen.findByAltText('Static map with geometry'))).toBeDefined();
  });

  test('triggers the onFormChange callback when user does a change to a form field', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider value={{ mapDrawingData: {}, setMapDrawingData: jest.fn() }}>
          <DetailsSection
            formSchema={eventSchemas.accident_rep.base.schema}
            formUISchema={eventSchemas.accident_rep.base.uiSchema}
            isCollection={false}
            loadingSchema={false}
            onFormChange={onFormChange}
            onFormError={onFormError}
            onFormSubmit={onFormSubmit}
            onReportedByChange={onReportedByChange}
            onReportDateChange={onReportDateChange}
            onReportGeometryChange={onReportGeometryChange}
            onReportLocationChange={onReportLocationChange}
            originalReport={report}
            reportForm={report}
            formValidator={formValidator}
          />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );

    expect(onFormChange).toHaveBeenCalledTimes(0);

    const typeOfAccidentField = await screen.findByLabelText('Type of accident');
    userEvent.type(typeOfAccidentField, 'Truck crash');

    expect(onFormChange).toHaveBeenCalled();
  });

  test('triggers the onFormSubmit callback when clicking the submit button', async () => {
    const submitFormButtonRef = {};
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider value={{ mapDrawingData: {}, setMapDrawingData: jest.fn() }}>
          <DetailsSection
            formSchema={eventSchemas.accident_rep.base.schema}
            formUISchema={eventSchemas.accident_rep.base.uiSchema}
            isCollection={false}
            loadingSchema={false}
            onFormChange={onFormChange}
            onFormError={onFormError}
            onFormSubmit={onFormSubmit}
            onReportedByChange={onReportedByChange}
            onReportDateChange={onReportDateChange}
            onReportGeometryChange={onReportGeometryChange}
            onReportLocationChange={onReportLocationChange}
            originalReport={report}
            reportForm={report}
            submitFormButtonRef={submitFormButtonRef}
            formValidator={formValidator}
          />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );

    expect(onFormSubmit).toHaveBeenCalledTimes(0);

    submitFormButtonRef.current.click();

    expect(onFormSubmit).toHaveBeenCalledTimes(1);
  });

  test('shows the loader while the schema has not loaded', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider value={{ mapDrawingData: {}, setMapDrawingData: jest.fn() }}>
          <DetailsSection
            formSchema={null}
            formUISchema={eventSchemas.accident_rep.base.uiSchema}
            loadingSchema
            onFormChange={onFormChange}
            onFormError={onFormError}
            onFormSubmit={onFormSubmit}
            onReportedByChange={onReportedByChange}
            onReportDateChange={onReportDateChange}
            onReportGeometryChange={onReportGeometryChange}
            onReportLocationChange={onReportLocationChange}
            originalReport={report}
            reportForm={report}
            formValidator={formValidator}
          />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );

    expect((await screen.findByTestId('reportManager-detailsSection-loader'))).toBeDefined();
  });

  test('triggers the onReportStateChange callback when user selects a new state', async () => {
    store.data.eventTypes = eventTypes;

    render(
      <Provider store={mockStore(store)}>
        <DetailsSection
          onReportedByChange={onReportedByChange}
          onReportDateChange={onReportDateChange}
          onReportGeometryChange={onReportGeometryChange}
          onReportLocationChange={onReportLocationChange}
          onReportStateChange={onReportStateChange}
          onReportTimeChange={onReportTimeChange}
          originalReport={report}
          reportForm={report}
          formValidator={formValidator}
        />
      </Provider>
    );

    const stateDropdown = await screen.findByText('active');
    userEvent.click(stateDropdown);

    expect(onReportStateChange).toHaveBeenCalledTimes(0);

    const resolvedItem = await screen.findByText('resolved');
    userEvent.click(resolvedItem);

    expect(onReportStateChange).toHaveBeenCalledTimes(1);
    expect(onReportStateChange.mock.calls[0][0]).toBe('resolved');
  });
});
