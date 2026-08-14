import React from 'react';
import { AxiosError } from 'axios';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../../__test-helpers/mocks';
import { eventSchemas, snareSchemaV2 } from '../../__test-helpers/fixtures/event-schemas';
import { eventTypes, snareV2 } from '../../__test-helpers/fixtures/event-types';
import { formValidator } from '../../utils/events';
import { GPS_FORMATS } from '../../utils/location';
import { MapContext } from '../../MapContext';
import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { mockStore } from '../../__test-helpers/MockStore';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { render, screen, waitFor, within } from '../../test-utils';
import { report } from '../../__test-helpers/fixtures/reports';
import { TrackerContext } from '../../utils/analytics';
import { VALID_EVENT_GEOMETRY_TYPES } from '../../constants';

import DetailsSection from './';

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

describe('ReportManager - DetailsSection', () => {
  const onFormDataChange = jest.fn(),
    onFormError = jest.fn(),
    onFormSubmit = jest.fn(),
    onLegacyFormChange = jest.fn(),
    onPriorityChange = jest.fn(),
    onReportedByChange = jest.fn(),
    onReportDateChange = jest.fn(),
    onReportGeometryChange = jest.fn(),
    onReportLocationChange = jest.fn(),
    onReportStateChange = jest.fn();

  eventSchemas.globalSchema.properties.reported_by.enum_ext[0].value = {
    id: '1234',
    name: 'Canek',
    subject_type: 'person',
    subject_subtype: 'ranger',
    is_active: true,
    image_url: '/static/ranger-black.svg'
  };

  let map, store, submitFormButtonRef;
  beforeEach(() => {
    map = createMapMock();

    submitFormButtonRef = { current: {} };

    store = {
      data: {
        subjectStore: {},
        eventStore: {},
        eventTypes,
        patrolTypes,
        eventSchemas: {
          ...eventSchemas,
          loading: false,
        },
      },
      view: {
        coordinateReferenceSystems: {
          selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
          storedSystems: [],
        },
        mapLocationSelection: { isPickingLocation: false },
        sideBar: {},
        systemConfig: {
          previewFeatures: { community_input_admin_enabled: true },
        },
        userPreferences: { gpsFormat: GPS_FORMATS.DEG },
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderDetailsSection = (
    props = null,
    mockedStore = mockStore(store),
    mapDrawingToolsContextValue = null
  ) => render(
    <Provider store={mockedStore}>
      <MapContext.Provider value={map}>
        <MapDrawingToolsContext.Provider value={{ ...mapDrawingToolsContextValue }}>
          <TrackerContext.Provider value={{ track: jest.fn() }}>
            <DetailsSection
              eventSchema={eventSchemas.accident_rep.base}
              formValidator={formValidator}
              isBehindAddedEvent={false}
              isCollection={false}
              isNewEvent={false}
              onFormDataChange={onFormDataChange}
              onFormError={onFormError}
              onFormSubmit={onFormSubmit}
              onLegacyFormChange={onLegacyFormChange}
              onPriorityChange={onPriorityChange}
              onReportedByChange={onReportedByChange}
              onReportDateChange={onReportDateChange}
              onReportGeometryChange={onReportGeometryChange}
              onReportLocationChange={onReportLocationChange}
              onReportStateChange={onReportStateChange}
              reportForm={report}
              submitFormButtonRef={submitFormButtonRef}
              {...props}
            />
          </TrackerContext.Provider>
        </MapDrawingToolsContext.Provider>
      </MapContext.Provider>
    </Provider>
  );

  test('opens and closes the state dropdown when clicking the toggle button', async () => {
    renderDetailsSection();

    expect(screen.queryByTestId('reportManager-detailsSection-stateDropdownMenu')).toBeNull();

    const stateDropdownToggleButton = screen.getByText('active');
    await userEvent.click(stateDropdownToggleButton);
    const stateDropdownMenu = screen.getByTestId('reportManager-detailsSection-stateDropdownMenu');

    expect(stateDropdownMenu).toHaveClass('show');

    await userEvent.click(stateDropdownToggleButton);

    expect(stateDropdownMenu).not.toHaveClass('show');
  });

  test('closes the state dropdown when pressing escape', async () => {
    renderDetailsSection();

    const stateDropdownToggleButton = screen.getByText('active');
    await userEvent.click(stateDropdownToggleButton);
    const stateDropdownMenu = screen.getByTestId('reportManager-detailsSection-stateDropdownMenu');

    expect(stateDropdownMenu).toHaveClass('show');

    await userEvent.keyboard('{Escape}');

    expect(stateDropdownMenu).not.toHaveClass('show');
  });

  test('lists the valid event states when opening the state dropdown', async () => {
    renderDetailsSection();

    const stateDropdownToggleButton = screen.getByText('active');
    await userEvent.click(stateDropdownToggleButton);
    const stateDropdownMenu = screen.getByTestId('reportManager-detailsSection-stateDropdownMenu');
    const stateDropdownItems = within(stateDropdownMenu).getAllByRole('button');

    expect(stateDropdownItems).toHaveLength(3);
    expect(stateDropdownItems[0]).toHaveTextContent('active');
    expect(stateDropdownItems[1]).toHaveTextContent('resolved');
    expect(stateDropdownItems[2]).toHaveTextContent('review');
  });

  test('changes the state of the event when selecting an item from the state dropdown', async () => {
    renderDetailsSection();

    await userEvent.click(screen.getByText('active'));
    const stateDropdownMenu = screen.getByTestId('reportManager-detailsSection-stateDropdownMenu');

    expect(onReportStateChange).toHaveBeenCalledTimes(0);
    expect(stateDropdownMenu).toHaveClass('show');

    await userEvent.click(screen.getByText('resolved'));

    expect(onReportStateChange).toHaveBeenCalledTimes(1);
    expect(onReportStateChange.mock.calls[0][0]).toBe('resolved');
    expect(stateDropdownMenu).not.toHaveClass('show');
  });

  test('does not show the reported by select if the event is a collection', async () => {
    renderDetailsSection({ isCollection: true });

    expect(screen.queryByText('Reported By')).toBeNull();
  });

  test('shows the reported by select if the event is not a collection', async () => {
    renderDetailsSection();

    expect(screen.getByText('Reported By')).toBeVisible();
  });

  test('does not disable the reported by select if the schema is not readonly', async () => {
    renderDetailsSection();

    expect(screen.getByText('Reported By')).not.toBeDisabled();
  });

  test('changes the reporter of the event when selecting an item from the reported by select', async () => {
    renderDetailsSection();

    await userEvent.click(screen.getByText('Reported By...'));

    expect(onReportedByChange).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByText('Canek'));

    expect(onReportedByChange).toHaveBeenCalledTimes(1);
    expect(onReportedByChange).toHaveBeenCalledWith({
      id: '1234',
      image_url: '/static/ranger-black.svg',
      is_active: true,
      name: 'Canek',
      subject_subtype: 'ranger',
      subject_type: 'person',
    }, {
      action: 'select-option',
      name: undefined,
      option: undefined,
    });
  });

  test('changes the priority of the event when selecting an item from priority select', async () => {
    renderDetailsSection();

    await userEvent.click(screen.getByText('Red'));

    expect(onPriorityChange).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByText('Green'));

    expect(onPriorityChange).toHaveBeenCalledTimes(1);
    expect(onPriorityChange).toHaveBeenCalledWith(
      { display: 'Green', key: 'green', value: 100 },
      { action: 'select-option', name: undefined, option: undefined }
    );
  });

  test('does not show the location selector if the event is a collection', async () => {
    renderDetailsSection({ isCollection: true });

    expect(screen.queryByText('Event Location')).toBeNull();
  });

  test('shows the location picker if the event is not a collection', async () => {
    renderDetailsSection();

    expect(screen.getByRole('textbox', { name: 'Location' })).toBeVisible();
  });

  test('shows the area picker if the geometry type of the event is polygon', async () => {
    store.data.eventTypes = eventTypes.map((eventType) => {
      if (eventType.value === report.event_type) {
        return { ...eventType, geometry_type: VALID_EVENT_GEOMETRY_TYPES.POLYGON };
      }
      return eventType;
    });
    renderDetailsSection();

    expect(screen.getByRole('textbox', { name: 'Area' })).toBeVisible();
    expect(screen.queryByRole('textbox', { name: 'Location' })).toBeNull();
  });

  test('shows the area picker as read only if the event type is read only', async () => {
    store.data.eventTypes = eventTypes.map((eventType) => {
      if (eventType.value === report.event_type) {
        return { ...eventType, geometry_type: VALID_EVENT_GEOMETRY_TYPES.POLYGON };
      }
      return eventType;
    });
    renderDetailsSection({
      eventSchema: {
        ...eventSchemas.accident_rep.base,
        schema: {
          ...eventSchemas.accident_rep.base.schema,
          readonly: true,
        },
      }
    });

    expect(screen.getByTestId('reportManager-detailsSection-areaPicker')).toHaveClass('readOnly');
  });

  test('changes the geometry of the event when selecting an area from the area picker', async () => {
    store.data.eventTypes = eventTypes.map((eventType) => {
      if (eventType.value === report.event_type) {
        return { ...eventType, geometry_type: VALID_EVENT_GEOMETRY_TYPES.POLYGON };
      }
      return eventType;
    });
    renderDetailsSection(undefined, undefined, { mapDrawingData: {}, setMapDrawingData: jest.fn() });

    expect(onReportGeometryChange).toHaveBeenCalledTimes(1);
  });

  test('shows the location picker if the geometry type of the event is not polygon', async () => {
    renderDetailsSection();

    expect(screen.getByRole('textbox', { name: 'Location' })).toBeVisible();
    expect(screen.queryByRole('textbox', { name: 'Area' })).toBeNull();
  });

  test('shows the location picker as read only if the event type is read only', async () => {
    renderDetailsSection({
      eventSchema: {
        ...eventSchemas.accident_rep.base,
        schema: {
          ...eventSchemas.accident_rep.base.schema,
          readonly: true,
        },
      }
    });

    expect(screen.getByTestId('reportManager-detailsSection-locationPicker')).toHaveClass('readOnly');
  });

  test('changes the location of the event when selecting a location from the location picker', async () => {
    renderDetailsSection();

    await userEvent.click(screen.getByLabelText('Event Location'));
    await userEvent.click(screen.getByLabelText('Pick a location on the map'));

    expect(onReportLocationChange).toHaveBeenCalledTimes(0);

    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });

    expect(onReportLocationChange).toHaveBeenCalledTimes(1);
    expect(onReportLocationChange).toHaveBeenCalledWith({ latitude: 55, longitude: 88 });
  });

  test('does not show the date picker if the event is a collection', async () => {
    renderDetailsSection({ isCollection: true });

    expect(screen.queryByText('Event Date')).toBeNull();
  });

  test('shows the date picker if the event is not a collection', async () => {
    renderDetailsSection();

    expect(screen.getByText('Event Date')).toBeVisible();
  });

  test('shows the date picker as read only if the event type is read only', async () => {
    renderDetailsSection({
      eventSchema: {
        ...eventSchemas.accident_rep.base,
        schema: {
          ...eventSchemas.accident_rep.base.schema,
          readonly: true,
        },
      }
    });

    expect(screen.getByTestId('reportManager-detailsSection-datePicker')).toHaveClass('readOnly');
  });

  test('changes the date of the event when selecting an option from the date picker', async () => {
    renderDetailsSection();

    await userEvent.click(screen.getByTestId('datePicker-input'));

    expect(onReportDateChange).not.toHaveBeenCalled();

    const datePicker = await screen.findByTestId('reportManager-detailsSection-datePicker');
    const datePickerOpenCalendarButton = await within(datePicker).findByLabelText('Open calendar');
    await userEvent.click(datePickerOpenCalendarButton);
    await userEvent.click(screen.getByRole('gridcell', { name: 'Choose Tuesday, April 12th, 2022' }));

    expect(onReportDateChange).toHaveBeenCalledTimes(1);
    expect(onReportDateChange.mock.calls[0][0].toISOString()).toMatch(/^2022-04-12/);
  });

  test('does not show the time picker if the event is a collection', async () => {
    renderDetailsSection({ isCollection: true });

    expect(screen.queryByText('Event Time')).toBeNull();
  });

  test('shows the time picker if the event is not a collection', async () => {
    renderDetailsSection();

    expect(screen.getByText('Event Time')).toBeVisible();
  });

  test('shows the date picker as read only if the event type is read only', async () => {
    renderDetailsSection({
      eventSchema: {
        ...eventSchemas.accident_rep.base,
        schema: {
          ...eventSchemas.accident_rep.base.schema,
          readonly: true,
        },
      }
    });

    expect(screen.getByTestId('reportManager-detailsSection-timePicker')).toHaveClass('readOnly');
  });

  test('changes the time of the event when selecting an option from the time picker', async () => {
    renderDetailsSection();

    expect(onReportDateChange).toHaveBeenCalledTimes(0);

    const timePicker = await screen.findByTestId('reportManager-detailsSection-timePicker');
    const timePickerOpenOptionsButton = await within(timePicker).findByLabelText('Open time options');
    await userEvent.click(timePickerOpenOptionsButton);
    const optionsList = await screen.findByTestId('timePicker-OptionsList');
    const timeOptionsListItems = await within(optionsList).findAllByRole('option');
    await userEvent.click(timeOptionsListItems[2]);

    expect(onReportDateChange).toHaveBeenCalled();
  });

  test('does not show the printable row with the geometry preview if report does not have a geometry', async () => {
    renderDetailsSection();

    expect(screen.queryByAltText('Static map with geometry')).toBeNull();
  });

  test('shows the printable row with the geometry preview if report has a geometry', async () => {
    store.data.eventTypes = eventTypes.map((eventType) => {
      if (eventType.value === report.event_type) {
        return { ...eventType, geometry_type: VALID_EVENT_GEOMETRY_TYPES.POLYGON };
      }
      return eventType;
    });
    renderDetailsSection({
      reportForm: {
        ...report,
        geometry: {
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
        },
      },
    });

    expect(screen.getByAltText('Static map with geometry')).toBeVisible();
  });

  test('changes the event form when changing the value of an input for legacy schemas', async () => {
    renderDetailsSection();

    expect(onLegacyFormChange).toHaveBeenCalledTimes(0);

    await userEvent.type(screen.getByLabelText('Type of accident'), 'Truck crash');

    expect(onLegacyFormChange).toHaveBeenCalled();
  });

  const legacyEventSchemaWithDropdown = {
    ...eventSchemas.accident_rep.base,
    schema: {
      ...eventSchemas.accident_rep.base.schema,
      properties: {
        ...eventSchemas.accident_rep.base.schema.properties,
        severity: {
          type: 'string',
          title: 'Severity',
          enum: ['minor', 'major'],
          enumNames: ['Minor', 'Major'],
          key: 'severity',
        },
      },
    },
    uiSchema: {
      ...eventSchemas.accident_rep.base.uiSchema,
      'ui:groups': [{
        origin: 'inferred',
        items: ['type_accident', 'number_people_involved', 'animals_involved', 'severity'],
      }],
    },
  };

  test('drops the key of a cleared dropdown from the legacy form change data', async () => {
    renderDetailsSection({
      eventSchema: legacyEventSchemaWithDropdown,
      reportForm: { ...report, event_details: { severity: 'minor', type_accident: 'Truck crash' } },
    });

    await userEvent.selectOptions(screen.getByLabelText('Severity'), '');

    const { formData } = onLegacyFormChange.mock.calls.at(-1)[0];
    expect(formData.severity).toBeUndefined();
    expect(formData.type_accident).toBe('Truck crash');
  });

  test('keeps event details keys that are not in the schema in the legacy form change data', async () => {
    renderDetailsSection({
      eventSchema: legacyEventSchemaWithDropdown,
      reportForm: {
        ...report,
        event_details: { severity: 'minor', stashed_hidden_field: 'stashed value', type_accident: 'Truck crash' },
      },
    });

    await userEvent.selectOptions(screen.getByLabelText('Severity'), '');

    const { formData } = onLegacyFormChange.mock.calls.at(-1)[0];
    expect(formData.stashed_hidden_field).toBe('stashed value');
  });

  test('submits the form for legacy schemas', async () => {
    renderDetailsSection();

    expect(onFormSubmit).toHaveBeenCalledTimes(0);

    submitFormButtonRef.current.click();

    await waitFor(() => {
      expect(onFormSubmit).toHaveBeenCalledTimes(1);
    });
  });

  test('changes the event form when changing the value of an input for v2 schemas', async () => {
    store.data.eventTypes = [...eventTypes, snareV2];
    renderDetailsSection({
      eventSchema: snareSchemaV2,
      reportForm: { ...report, event_type: 'snare_v2_rep' },
    });

    expect(onFormDataChange).toHaveBeenCalledTimes(0);

    await userEvent.type(screen.getByLabelText('Number of Snares Found *'), '3');

    expect(onFormDataChange).toHaveBeenCalled();
    expect(onFormDataChange).toHaveBeenCalledWith({ number_of_snares_found: 3 });
  });

  test('submits the form for v2 schemas', async () => {
    store.data.eventTypes = [...eventTypes, snareV2];
    renderDetailsSection({
      eventSchema: snareSchemaV2,
      reportForm: { ...report, event_details: { number_of_snares_found: 3 }, event_type: 'snare_v2_rep' },
    });

    expect(onFormSubmit).toHaveBeenCalledTimes(0);

    submitFormButtonRef.current.click();

    expect(onFormSubmit).toHaveBeenCalledTimes(1);
  });

  test('does not show the loader if the schema is loaded', async () => {
    renderDetailsSection();

    expect(screen.queryByTestId('reportManager-detailsSection-loader')).toBeNull();
  });

  test('shows a loader while the schema loads', async () => {
    store.data.eventSchemas.loading = true;
    renderDetailsSection({ eventSchema: null });

    expect(screen.getByTestId('reportManager-detailsSection-loader')).toBeVisible();
  });

  test('does not show an error message if the schema is loaded correctly', async () => {
    renderDetailsSection();

    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('shows an error message if the schema is erroneous', async () => {
    renderDetailsSection({ eventSchema: { error: new Error('Error loading schema') } });

    expect(screen.getByRole('alert')).toHaveTextContent('Error loading schema');
  });

  test('shows an error message with the detail of the error if the schema is erroneous', async () => {
    renderDetailsSection({
      eventSchema: {
        error: new AxiosError(
          'Request failed with status code 500',
          'ERR_BAD_RESPONSE',
          {},
          {},
          {
            data: {
              status: {
                detail: 'Error detail',
              },
            },
          },
        ),
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Error loading schemaError detail');
  });
});
