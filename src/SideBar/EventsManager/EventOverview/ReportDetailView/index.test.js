import React, { useEffect } from 'react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';
import { point } from '@turf/turf';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import AddItemButton from '../../../../AddItemButton';
import { addEventToIncident, createEvent, fetchEvent } from '../../../../ducks/events';
import { activePatrol } from '../../../../__test-helpers/fixtures/patrols';
import { createMapMock } from '../../../../__test-helpers/mocks';
import { attachmentSchemaV2, eventSchemas, snareSchemaV2 } from '../../../../__test-helpers/fixtures/event-schemas';
import { eventTypes, snareV2 } from '../../../../__test-helpers/fixtures/event-types';
import { executeSaveActions, generateSaveActionsForReportLikeObject } from '../../../../utils/save';
import { TrackerContext } from '../../../../utils/analytics';
import { fetchEventTypeSchema } from '../../../../ducks/event-schemas';
import { GPS_FORMATS } from '../../../../utils/location';
import { MapContext } from '../../../../MapContext';
import NavigationContextProvider from '../../../../NavigationContextProvider';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { PATROLS_API_URL } from '../../../../ducks/patrols';
import patrolTypes from '../../../../__test-helpers/fixtures/patrol-types';
import ReportDetailView from './';
import { setLocallyEditedEvent, unsetLocallyEditedEvent } from '../../../../ducks/locally-edited-event';
import { TAB_KEYS } from '../../../../constants';
import { uploadFile } from '../../../../ducks/user-content';
import useNavigate from '../../../../hooks/useNavigate';
import { notes } from '../../../../__test-helpers/fixtures/reports';
import { SidebarScrollProvider } from '../../../../SidebarScrollContext';
import { cleanup, render, screen, waitFor, within } from '../../../../test-utils';

import * as styles from './styles.module.scss';

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

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => () => null,
}));

jest.mock('../../../../AddItemButton', () => jest.fn());

jest.mock('../../../../hooks/useNavigate', () => jest.fn());

jest.mock('../../../../ducks/events', () => ({
  ...jest.requireActual('../../../../ducks/events'),
  addEventToIncident: jest.fn(),
  createEvent: jest.fn(),
  fetchEvent: jest.fn(),
}));

jest.mock('../../../../ducks/locally-edited-event', () => ({
  ...jest.requireActual('../../../../ducks/locally-edited-event'),
  setLocallyEditedEvent: jest.fn(),
  unsetLocallyEditedEvent: jest.fn(),
}));

jest.mock('../../../../ducks/event-schemas', () => ({
  ...jest.requireActual('../../../../ducks/event-schemas'),
  fetchEventTypeSchema: jest.fn(),
}));

jest.mock('../../../../ducks/user-content', () => ({
  ...jest.requireActual('../../../../ducks/user-content'),
  uploadFile: jest.fn(),
}));

jest.mock('../../../../utils/save', () => ({
  ...jest.requireActual('../../../../utils/save'),
  generateSaveActionsForReportLikeObject: jest.fn(),
  executeSaveActions: jest.fn(),
}));

const server = setupServer(
  http.get(`${PATROLS_API_URL}:id`, () => HttpResponse.json({ data: { data: activePatrol } })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SideBar - EventsManager - EventOverview - ReportDetailView', () => {
  const mockReportWithNotes = {
    event_type: 'jtar',
    geojson: point([10, 5]),
    id: '456',
    notes: notes,
    priority: 0,
    state: 'active',
    time: new Date('2022-12-17T03:24:00'),
    title: 'title',
    updates: [{
      message: 'message',
      time: new Date('2022-12-17T03:26:00'),
      user: { first_name: 'First', last_name: 'Last' },
    }],
  };
  const mockReport = {
    event_type: 'jtar',
    geojson: point([10, 5]),
    id: '123',
    priority: 0,
    state: 'active',
    time: new Date('2022-12-17T03:24:00'),
    title: 'title',
    updates: [{
      message: 'message',
      time: new Date('2022-12-17T03:26:00'),
      user: { first_name: 'First', last_name: 'Last' },
    }],
  };
  const setUpLegacyChoiceListEvent = () => {
    state.data.eventTypes = [...eventTypes, snareV2];
    state.data.eventSchemas = {
      ...eventSchemas,
      [snareV2.value]: {
        792: {
          json: {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            properties: {
              team_members: {
                items: {
                  anyOf: [{
                    enum: ['kumoi_njapit', 'sam_kumum'],
                    'x-enumExtra': {
                      kumoi_njapit: { display: 'Kumoi Njapit' },
                      sam_kumum: { display: 'Sam Kumum' },
                    },
                  }],
                },
                title: 'Team Member',
                type: 'array',
              },
            },
            required: [],
            type: 'object',
            unevaluatedProperties: false,
          },
          ui: {
            fields: { team_members: { inputType: 'LIST', parent: 'section-1', type: 'CHOICE_LIST' } },
            headers: {},
            order: ['section-1'],
            sections: {
              'section-1': {
                columns: 1,
                isActive: true,
                label: 'Details',
                leftColumn: [{ name: 'team_members', type: 'field' }],
                rightColumn: [],
              },
            },
          },
        },
      },
    };
    state.data.eventStore = {
      ...state.data.eventStore,
      792: {
        ...mockReport,
        event_type: snareV2.value,
        event_details: {
          team_members: [
            { name: 'Kumoi Njapit', value: 'kumoi_njapit' },
            { name: 'Sam Kumum', value: 'sam_kumum' },
          ],
        },
        id: '792',
      },
    };
  };
  let AddItemButtonMock,
    addEventToIncidentMock,
    createEventMock,
    executeSaveActionsMock,
    generateSaveActionsForReportLikeObjectMock,
    fetchEventMock,
    fetchEventTypeSchemaMock,
    setLocallyEditedEventMock,
    unsetLocallyEditedEventMock,
    map,
    navigate,
    useNavigateMock,
    Wrapper,
    renderWithWrapper,
    state,
    store;

  beforeEach(() => {
    AddItemButtonMock = jest.fn(() => <button data-testid="addItemButton-button" />);
    AddItemButton.mockImplementation(AddItemButtonMock);
    addEventToIncidentMock = jest.fn(() => () => {});
    addEventToIncident.mockImplementation(addEventToIncidentMock);
    createEventMock =  jest.fn(() => (event) => event);
    createEvent.mockImplementation(createEventMock);
    executeSaveActionsMock = jest.fn(() => Promise.resolve());
    executeSaveActions.mockImplementation(executeSaveActionsMock);
    generateSaveActionsForReportLikeObjectMock = jest.requireActual('../../../../utils/save').generateSaveActionsForReportLikeObject;
    generateSaveActionsForReportLikeObject.mockImplementation(generateSaveActionsForReportLikeObjectMock);
    fetchEventMock = jest.fn(() => () => {});
    fetchEvent.mockImplementation(fetchEventMock);
    fetchEventTypeSchemaMock = jest.fn(() => () => {});
    fetchEventTypeSchema.mockImplementation(fetchEventTypeSchemaMock);
    setLocallyEditedEventMock = jest.fn(() => () => {});
    setLocallyEditedEvent.mockImplementation(setLocallyEditedEventMock);
    unsetLocallyEditedEventMock = jest.fn(() => () => {});
    unsetLocallyEditedEvent.mockImplementation(unsetLocallyEditedEventMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    map = createMapMock();

    Wrapper = ({ children }) => <Provider store={store}> {/* eslint-disable-line react/display-name */}
      <MemoryRouter>
        <NavigationContextProvider>
          <MapContext.Provider value={map}>
            <TrackerContext.Provider value={{ track: jest.fn() }}>
              <SidebarScrollProvider>
                {children}
              </SidebarScrollProvider>
            </TrackerContext.Provider>
          </MapContext.Provider>
        </NavigationContextProvider>
      </MemoryRouter>
    </Provider>;

    state = {
      data: {
        subjectStore: {},
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        eventStore: { 456: mockReportWithNotes, 123: mockReport },
        eventTypes,
        patrolTypes,
        eventSchemas,
        patrolStore: { 123: activePatrol },
        tracks: {},
        userContent: {},
      },
      view: {
        coordinateReferenceSystems: {
          selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
          storedSystems: [],
        },
        mapLocationSelection: { isPickingLocation: false },
        patrolTrackState: { hiddenSubjects: {}, pinned: [], visible: [] },
        sideBar: {},
        systemConfig: {},
        timeSliderState: { active: false },
        trackSettings: { length: 21, origin: 'CUSTOM_LENGTH' },
        userPreferences: { gpsFormat: GPS_FORMATS.DEG },
      },
    };

    store = mockStore(() => state);

    renderWithWrapper = (Component, wrapper = Wrapper) => render(Component, { wrapper });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not fetch the event schema if it is loaded already', async () => {
    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="1234"
          />
    );

    expect(fetchEventTypeSchema).not.toHaveBeenCalled();
  });

  test('does not fetch the event schema if the event type is not available yet', async () => {
    state.data.eventTypes = [];
    renderWithWrapper(
      <ReportDetailView
            isNewReport={false}
            reportId="456"
          />
    );

    expect(fetchEventTypeSchema).not.toHaveBeenCalled();
  });

  test('fetches the event schema if it is not loaded already', async () => {
    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="74941f0d-4b89-48be-a62a-a74c78db8383"
            reportId="1234"
          />
    );

    expect(fetchEventTypeSchema).toHaveBeenCalled();
    expect(fetchEventTypeSchema).toHaveBeenCalledWith('fire_rep', undefined, null);
  });

  test('updates the title when user types in it', async () => {
    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="1234"
          />
    );

    const titleInput = await screen.findByRole('textbox', { name: 'Event title' });

    expect(titleInput).toHaveValue('Accident');

    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, '2');

    expect(titleInput).toHaveValue('2');
  });

  test('sets the location when user changes it', async () => {
    renderWithWrapper(
      <ReportDetailView
        isNewReport
        newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
        reportId="1234"
      />
    );

    await userEvent.click(screen.getByRole('textbox', { name: 'Event Location' }));
    await userEvent.click(screen.getByLabelText('Pick a location on the map'));

    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Event Location' })).toHaveValue('55.000000°, 88.000000°');
    });
  });

  test('sets the date when user changes it', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    const datePicker = await screen.findByRole('group', { name: 'Event Date' });
    const datePickerOpenCalendarButton = await within(datePicker).findByLabelText('Open calendar');
    await userEvent.click(datePickerOpenCalendarButton);
    await userEvent.click(screen.getByRole('gridcell', { name: 'Choose Thursday, December 22nd, 2022' }));

    expect(await within(datePicker).findByTestId('datePicker-input')).toHaveValue('2022-12-22');
  });

  test('sets the time when user changes it', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    const timePicker = await screen.findByRole('group', { name: 'Event Time' });
    const timePickerOpenOptionsButton = await within(timePicker).findByLabelText('Open time options');
    await userEvent.click(timePickerOpenOptionsButton);
    const optionsList = await screen.findByTestId('timePicker-optionsList');
    const timeOptionsListItems = await within(optionsList).findAllByRole('option');
    await userEvent.click(timeOptionsListItems[2]);

    expect(await within(timePicker).findByTestId('timePicker-input')).toHaveValue('00:30');
  });

  test('updates the JSON form schema when user does a change', async () => {
    renderWithWrapper(
      <ReportDetailView
              isNewReport
              newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
              reportId="1234"
            />
    );

    const typeOfAccidentField = await screen.findByLabelText('Type of accident');
    await userEvent.type(typeOfAccidentField, 'Truck crash');

    expect((await screen.findByDisplayValue('Truck crash'))).toBeDefined();
  });

  test('sends an empty value for a cleared legacy dropdown and keeps out-of-schema event details when saving', async () => {
    const accidentSchema = eventSchemas.accident_rep.base;
    state.data.eventSchemas = {
      ...eventSchemas,
      accident_rep: {
        ...eventSchemas.accident_rep,
        789: {
          ...accidentSchema,
          schema: {
            ...accidentSchema.schema,
            properties: {
              ...accidentSchema.schema.properties,
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
            ...accidentSchema.uiSchema,
            'ui:groups': [{
              origin: 'inferred',
              items: ['type_accident', 'number_people_involved', 'animals_involved', 'severity'],
            }],
          },
        },
      },
    };
    state.data.eventStore = {
      ...state.data.eventStore,
      789: {
        ...mockReport,
        event_type: 'accident_rep',
        event_details: { severity: 'minor', stashed_hidden_field: 'stashed value', type_accident: 'Truck crash' },
        id: '789',
      },
    };

    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="789" />);

    await userEvent.selectOptions(await screen.findByLabelText('Severity'), '');

    await userEvent.click(await screen.findByText('Save'));

    await waitFor(() => {
      expect(generateSaveActionsForReportLikeObject).toHaveBeenCalledTimes(1);
    });
    expect(generateSaveActionsForReportLikeObject.mock.calls[0][0].event_details).toEqual({
      severity: '',
      stashed_hidden_field: 'stashed value',
      type_accident: 'Truck crash',
    });
  });

  test('allows saving when a cleared legacy dropdown would otherwise fail enum validation', async () => {
    const accidentSchema = eventSchemas.accident_rep.base;
    // Drop the fixture's `required: []`: an empty array fails ajv's own meta-schema
    // validation.
    const { required: _unusedRequired, ...baseSchemaWithoutRequired } = accidentSchema.schema;
    state.data.eventSchemas = {
      ...eventSchemas,
      accident_rep: {
        ...eventSchemas.accident_rep,
        790: {
          ...accidentSchema,
          schema: {
            ...baseSchemaWithoutRequired,
            id: 'https://era-7995.pamdas.org/api/v1.0/activity/events/schema/eventtype/accident_rep_enum_clear_test',
            properties: {
              ...accidentSchema.schema.properties,
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
            ...accidentSchema.uiSchema,
            'ui:groups': [{
              origin: 'inferred',
              items: ['type_accident', 'number_people_involved', 'animals_involved', 'severity'],
            }],
          },
        },
      },
    };
    state.data.eventStore = {
      ...state.data.eventStore,
      790: {
        ...mockReport,
        event_type: 'accident_rep',
        event_details: { severity: 'minor', type_accident: 'Truck crash' },
        id: '790',
      },
    };

    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="790" />);

    await userEvent.selectOptions(await screen.findByLabelText('Severity'), '');

    // Also edits an unrelated field, confirming the cleared value coexists with
    // other, unrelated changes in the saved payload.
    await userEvent.type(await screen.findByLabelText('Type of accident'), '!');

    await userEvent.click(await screen.findByText('Save'));

    await waitFor(() => {
      expect(generateSaveActionsForReportLikeObject).toHaveBeenCalledTimes(1);
    });
    expect(generateSaveActionsForReportLikeObject.mock.calls[0][0].event_details).toEqual({
      severity: '',
      type_accident: 'Truck crash!',
    });
  });

  test('still blocks saving when a cleared legacy dropdown is required by the schema', async () => {
    const accidentSchema = eventSchemas.accident_rep.base;
    state.data.eventSchemas = {
      ...eventSchemas,
      accident_rep: {
        ...eventSchemas.accident_rep,
        790: {
          ...accidentSchema,
          schema: {
            ...accidentSchema.schema,
            id: 'https://era-7995.pamdas.org/api/v1.0/activity/events/schema/eventtype/accident_rep_required_enum_test',
            properties: {
              ...accidentSchema.schema.properties,
              severity: {
                type: 'string',
                title: 'Severity',
                enum: ['minor', 'major'],
                enumNames: ['Minor', 'Major'],
                key: 'severity',
              },
            },
            required: ['severity'],
          },
          uiSchema: {
            ...accidentSchema.uiSchema,
            'ui:groups': [{
              origin: 'inferred',
              items: ['type_accident', 'number_people_involved', 'animals_involved', 'severity'],
            }],
          },
        },
      },
    };
    state.data.eventStore = {
      ...state.data.eventStore,
      790: {
        ...mockReport,
        event_type: 'accident_rep',
        event_details: { severity: 'minor', type_accident: 'Truck crash' },
        id: '790',
      },
    };

    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="790" />);

    await userEvent.selectOptions(await screen.findByLabelText(/Severity/), '');
    await userEvent.type(await screen.findByLabelText('Type of accident'), '!');

    document.querySelector('form').noValidate = true;
    await userEvent.click(await screen.findByText('Save'));

    expect(await screen.findAllByTestId('error-message')).not.toHaveLength(0);
    expect(generateSaveActionsForReportLikeObject).not.toHaveBeenCalled();
  });

  test('sets the state when user changes it', async () => {
    renderWithWrapper(
      <ReportDetailView
              isNewReport
              newReportTypeId="d0884b8c-4ecb-45da-841d-f2f8d6246abf"
              reportId="1234"
            />
    );

    const stateSelect = await screen.findByRole('button', { name: 'Active, Change event state' });
    await userEvent.click(stateSelect);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Resolve' }));

    expect(stateSelect).toHaveAccessibleName('Resolved, Change event state');
  });

  test('saves the stored empty choice of an event with the rest of an edit', async () => {
    const accidentSchema = eventSchemas.accident_rep.base;
    // Drop the fixture's `required: []`: an empty array fails ajv's own meta-schema
    // validation.
    const { required: _unusedRequired, ...baseSchemaWithoutRequired } = accidentSchema.schema;
    state.data.eventSchemas = {
      ...eventSchemas,
      accident_rep: {
        ...eventSchemas.accident_rep,
        791: {
          ...accidentSchema,
          schema: {
            ...baseSchemaWithoutRequired,
            id: 'https://era-7995.pamdas.org/api/v1.0/activity/events/schema/eventtype/accident_rep_reopen_enum_test',
            properties: {
              ...accidentSchema.schema.properties,
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
            ...accidentSchema.uiSchema,
            'ui:groups': [{
              origin: 'inferred',
              items: ['type_accident', 'number_people_involved', 'animals_involved', 'severity'],
            }],
          },
        },
      },
    };
    state.data.eventStore = {
      ...state.data.eventStore,
      791: {
        ...mockReport,
        event_type: 'accident_rep',
        event_details: { severity: '', type_accident: 'Truck crash' },
        id: '791',
      },
    };

    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="791" />);

    await screen.findByLabelText('Severity');

    await userEvent.type(screen.getByRole('textbox', { name: 'Event title' }), '!');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(generateSaveActionsForReportLikeObject).toHaveBeenCalledTimes(1);
    });
    expect(generateSaveActionsForReportLikeObject.mock.calls[0][0].event_details).toEqual({
      severity: '',
      type_accident: 'Truck crash',
    });
  });

  test('renders and saves, with an edit, the option values of a legacy V2 choice list stored as objects', async () => {
    setUpLegacyChoiceListEvent();

    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="792" />);

    expect(await screen.findByRole('checkbox', { name: 'Kumoi Njapit' })).toBeChecked();
    expect(await screen.findByRole('checkbox', { name: 'Sam Kumum' })).toBeChecked();

    await userEvent.type(screen.getByRole('textbox', { name: 'Event title' }), '!');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(generateSaveActionsForReportLikeObject).toHaveBeenCalledTimes(1);
    });
    expect(generateSaveActionsForReportLikeObject.mock.calls[0][0].event_details).toEqual({
      team_members: ['kumoi_njapit', 'sam_kumum'],
    });
  });

  test('counts setting a legacy field saved blank to its default as a change to save', async () => {
    const accidentSchema = eventSchemas.accident_rep.base;
    state.data.eventSchemas = {
      ...eventSchemas,
      accident_rep: {
        ...eventSchemas.accident_rep,
        796: {
          ...accidentSchema,
          schema: {
            ...accidentSchema.schema,
            id: 'https://era-7995.pamdas.org/api/v1.0/activity/events/schema/eventtype/accident_rep_blank_default_test',
            properties: {
              ...accidentSchema.schema.properties,
              type_accident: { ...accidentSchema.schema.properties.type_accident, default: 'Truck crash' },
            },
          },
        },
      },
    };
    state.data.eventStore = {
      ...state.data.eventStore,
      796: { ...mockReport, event_details: { type_accident: '' }, event_type: 'accident_rep', id: '796' },
    };

    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="796" />);

    const saveButton = await screen.findByRole('button', { name: 'Save' });

    expect(saveButton).toBeDisabled();

    await userEvent.type(await screen.findByRole('textbox', { name: 'Type of accident' }), 'Truck crash');

    expect(saveButton).toBeEnabled();
  });

  test('disables saving an event with nothing to save until the user changes it', async () => {
    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="456" />);

    const saveButton = await screen.findByRole('button', { name: 'Save' });

    expect(saveButton).toBeDisabled();
    expect(screen.getByRole('button', { name: 'More save options' })).toBeEnabled();

    await userEvent.type(screen.getByRole('textbox', { name: 'Event title' }), '!');

    expect(saveButton).toBeEnabled();
  });

  test('disables saving again when the user types back the type an untitled event shows', async () => {
    state.data.eventStore = { 456: { ...mockReport, title: null } };

    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="456" />);

    const saveButton = await screen.findByRole('button', { name: 'Save' });
    const titleInput = screen.getByRole('textbox', { name: 'Event title' });
    const typeTitle = titleInput.value;

    await userEvent.type(titleInput, '!');

    expect(saveButton).toBeEnabled();

    await userEvent.type(titleInput, '{Backspace}');

    expect(titleInput).toHaveValue(typeTitle);
    expect(saveButton).toBeDisabled();
  });

  test('lets the user save a new event without changes', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74" reportId="1234" />
    );

    expect(await screen.findByRole('button', { name: 'Save' })).toBeEnabled();
  });

  test('disables saving again when the user empties a field that was saved empty', async () => {
    state.data.eventSchemas = {
      ...eventSchemas,
      accident_rep: { ...eventSchemas.accident_rep, 795: eventSchemas.accident_rep.base },
    };
    state.data.eventStore = {
      ...state.data.eventStore,
      795: { ...mockReport, event_details: {}, event_type: 'accident_rep', id: '795' },
    };

    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="795" />);

    const saveButton = await screen.findByRole('button', { name: 'Save' });
    const typeInput = await screen.findByRole('textbox', { name: 'Type of accident' });

    await userEvent.type(typeInput, 'Truck crash');

    expect(saveButton).toBeEnabled();

    await userEvent.clear(typeInput);

    expect(saveButton).toBeDisabled();
  });

  test('counts clearing a saved field as a change to save', async () => {
    state.data.eventTypes = [...eventTypes, snareV2];
    state.data.eventSchemas = { ...eventSchemas, [snareV2.value]: { 794: snareSchemaV2 } };
    state.data.eventStore = {
      ...state.data.eventStore,
      794: { ...mockReport, event_details: { number_of_snares_found: 3 }, event_type: snareV2.value, id: '794' },
    };

    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="794" />);

    const saveButton = await screen.findByRole('button', { name: 'Save' });

    expect(saveButton).toBeDisabled();

    await userEvent.clear(await screen.findByLabelText('Number of Snares Found *'));

    expect(saveButton).toBeEnabled();
  });

  test('does not offer a cancel button for an event', async () => {
    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="1234"
          />
    );

    expect(await screen.findByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancel/ })).toBeNull();
  });

  test('returns an event being added to a patrol to the patrol when the user cancels it', async () => {
    renderWithWrapper(
      <ReportDetailView
        formProps={{ isPatrolReport: true, redirectTo: [{ pathname: '/patrols/123' }] }}
        isNewReport
        newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
        reportId="1234"
      />
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel adding this event' }));

    expect(navigate).toHaveBeenCalledWith({ pathname: '/patrols/123' });
  });

  test('displays a new attachment', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.queryByTestId('attachment-icon'))).toBeNull();

    const addAttachmentButton = await screen.findByTestId('addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    await userEvent.upload(addAttachmentButton, fakeFile);

    expect((await screen.findAllByTestId('attachment-icon'))).toHaveLength(1);
  });

  test('deletes a new attachment', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    const addAttachmentButton = await screen.findByTestId('addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    await userEvent.upload(addAttachmentButton, fakeFile);

    expect((await screen.findAllByTestId('attachment-icon'))).toHaveLength(1);

    const deleteAttachmentButton = await screen.findByTestId('activitySection-trashCan-fake.txt');
    await userEvent.click(deleteAttachmentButton);

    expect((await screen.queryByTestId('attachment-icon'))).toBeNull();
  });

  test('displays a new note', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.findAllByTestId('note-icon'))).toHaveLength(notes.length);

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton-original');
    await userEvent.click(addNoteButton);

    expect((await screen.findAllByTestId('note-icon'))).toHaveLength(notes.length + 1);
  });

  test('deletes a new note', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="123" />
    );

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton-original');
    await userEvent.click(addNoteButton);

    expect((await screen.findAllByTestId('note-icon'))).toHaveLength(1);

    const deleteNoteButton = await screen.findByTestId('activitySection-deleteIcon-');
    await userEvent.click(deleteNoteButton);

    expect((await screen.queryByTestId('note-icon'))).toBeNull();
  });

  test('if the current report is a collection, adding a new one simply appends it', async () => {
    const addedReport = [{ data: { data: { id: 'added' } } }];
    const initialReport = [{ data: { data: { id: 'initial' } } }];

    executeSaveActionsMock = jest.fn(() => Promise.resolve(initialReport));
    executeSaveActions.mockImplementation(executeSaveActionsMock);

    AddItemButtonMock = ({ formProps }) => { /* eslint-disable-line react/display-name */
      useEffect(() => {
        formProps.onSaveSuccess(addedReport);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null;
    };
    AddItemButton.mockImplementation(AddItemButtonMock);

    fetchEventMock = jest.fn(() => () => initialReport[0]);
    fetchEvent.mockImplementation(fetchEventMock);

    state.data.eventStore = { initial: { ...mockReport, id: 'initial', is_collection: true } };

    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="initial" />
    );

    await waitFor(() => {
      expect(addEventToIncident).toHaveBeenCalledTimes(1);
      expect(addEventToIncident).toHaveBeenCalledWith('added', 'initial');
      expect(fetchEvent).toHaveBeenCalled();
      expect(fetchEvent).toHaveBeenCalledWith('initial');
    });
  });

  test('if the current report is not a collection, adding a new one creates a collections and appends both', async () => {
    const addedReport = { id: 'added' };
    const initialReport = { id: 'initial' };
    const incidentCollection = {
      data: {
        data: {
          id: 'incident',
          contains: [{ related_event: addedReport }, { related_event: initialReport }]
        }
      }
    };

    executeSaveActionsMock = jest.fn(() => Promise.resolve([{ data: { data: addedReport } }]));
    executeSaveActions.mockImplementation(executeSaveActionsMock);

    AddItemButtonMock = ({ formProps }) => { /* eslint-disable-line react/display-name */
      useEffect(() => {
        formProps.onSaveSuccess([{ data: { data: initialReport } }]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null;
    };
    AddItemButton.mockImplementation(AddItemButtonMock);

    createEventMock = jest.fn(() => () => incidentCollection);
    createEvent.mockImplementation(createEventMock);

    fetchEventMock = jest.fn(() => () => incidentCollection);
    fetchEvent.mockImplementation(fetchEventMock);

    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="1234"
          />
    );

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(1);
      expect(addEventToIncident).toHaveBeenCalledTimes(2);
      expect(addEventToIncident).toHaveBeenCalledWith('initial', 'incident');
      expect(addEventToIncident).toHaveBeenCalledWith('added', 'incident');
      expect(fetchEvent).toHaveBeenCalled();
      expect(fetchEvent).toHaveBeenCalledWith('incident');
      expect(navigate).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/events/incident', { replace: true });
    });
  });

  test('triggers the formProps onSaveSuccess callback if there is a report is saved', async () => {
    const onSaveSuccess = jest.fn();

    renderWithWrapper(
      <ReportDetailView
        formProps={{ onSaveSuccess }}
        isNewReport
        newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
      />
    );

    const titleTextBox = await screen.findByRole('textbox', { name: 'Event title' });
    await userEvent.type(titleTextBox, '2');
    await userEvent.tab();

    expect(onSaveSuccess).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('executes save actions when clicking save and navigates to report feed', async () => {
    renderWithWrapper(
      <ReportDetailView
        isNewReport
        newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
      />
    );

    const titleTextBox = await screen.findByRole('textbox', { name: 'Event title' });
    await userEvent.type(titleTextBox, '2');
    await userEvent.tab();

    expect(executeSaveActions).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    await userEvent.click(saveButton);

    expect(executeSaveActions).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(`/${TAB_KEYS.EVENTS}`);
    });
  });

  test('locks the event while it saves, since the save sends it as it was', async () => {
    executeSaveActionsMock = jest.fn(() => new Promise(() => {}));
    executeSaveActions.mockImplementation(executeSaveActionsMock);

    renderWithWrapper(<ReportDetailView isNewReport newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Save' }));

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('banner')).toHaveAttribute('inert');
    expect(screen.getByRole('combobox', { name: 'Priority' }).closest('[inert]')).not.toBeNull();
  });

  const renderAndAssertNoteEdition = async (updatedText, noteId) => {
    renderWithWrapper(
      <ReportDetailView
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="456"
        />
    );
    const editNoteIcon = await screen.findByTestId(`activitySection-editIcon-${noteId}`);
    await userEvent.click(editNoteIcon);

    const noteTextArea = await screen.findByTestId(`activitySection-noteTextArea-${noteId}`);
    await userEvent.type(noteTextArea, updatedText);

    const doneNoteButton = await screen.findByTestId(`activitySection-noteDone-${noteId}`);
    await userEvent.click(doneNoteButton);

    const textArea = await screen.findByTestId(`activitySection-noteTextArea-${noteId}`);
    return { textArea, doneNoteButton };
  };

  test('saves a new edited note', async () => {
    const updatedText = ' with changes';
    const [note] = notes;
    const { textArea, doneNoteButton } = await renderAndAssertNoteEdition(updatedText, note.id);

    expect(textArea.value).toBe(`${note.text}${updatedText}`);
    expect(doneNoteButton).not.toBeInTheDocument();
  });

  test('empty spaces at the end of a note get trimmed before saving', async () => {
    const updatedText = ' with spaces  ';
    const [note] = notes;
    const { textArea } = await renderAndAssertNoteEdition(updatedText, note.id);

    expect(textArea.value).toBe(`${note.text} with spaces`);
  });

  test('triggers the formProps onSaveError callback if there is an error saving', async () => {
    const onSaveError = jest.fn();

    executeSaveActionsMock = jest.fn(() => Promise.reject());
    executeSaveActions.mockImplementation(executeSaveActionsMock);

    renderWithWrapper(
      <ReportDetailView
            formProps={{ onSaveError }}
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="456"
          />
    );

    const titleTextBox = await screen.findByRole('textbox', { name: 'Event title' });
    await userEvent.type(titleTextBox, '2');
    await userEvent.tab();

    expect(onSaveError).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(onSaveError).toHaveBeenCalledTimes(1);
    });
  });

  test('shows the error messages if the saving action fails', async () => {
    executeSaveActionsMock = jest.fn(() => Promise.reject());
    executeSaveActions.mockImplementation(executeSaveActionsMock);

    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="456"
          />
    );

    const titleTextBox = await screen.findByRole('textbox', { name: 'Event title' });
    await userEvent.type(titleTextBox, '2');
    await userEvent.tab();
    const saveButton = await screen.findByText('Save');
    await userEvent.click(saveButton);

    expect(await screen.findByText('Error saving event.')).toBeDefined();
  });

  test('shows a human-readable error message for an HTTP error response when saving fails', async () => {
    const tooManyRequestsError = { request: {}, response: { status: 429 } };

    executeSaveActionsMock = jest.fn(() => Promise.reject(tooManyRequestsError));
    executeSaveActions.mockImplementation(executeSaveActionsMock);

    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="456"
          />
    );

    const titleTextBox = await screen.findByRole('textbox', { name: 'Event title' });
    await userEvent.type(titleTextBox, '2');
    await userEvent.tab();
    const saveButton = await screen.findByText('Save');
    await userEvent.click(saveButton);

    expect(await screen.findByText(
      'Too many requests. Please try again later, and contact your administrator if this problem persists (429).'
    )).toBeDefined();
    expect(screen.queryByText('Unknown error')).toBeNull();
  });

  test('omits duplicated attachment files', async () => {
    window.alert = jest.fn();

    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.queryByTestId('attachment-icon'))).toBeNull();

    const addAttachmentButton = await screen.findByTestId('addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    await userEvent.upload(addAttachmentButton, fakeFile);

    expect((await screen.findAllByTestId('attachment-icon'))).toHaveLength(1);

    const fakeFileAgain = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    await userEvent.upload(addAttachmentButton, fakeFileAgain);

    expect((await screen.findAllByTestId('attachment-icon'))).toHaveLength(1);
  });

  test('can not add a second note without saving the first one', async () => {
    window.alert = jest.fn();

    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.findAllByTestId('note-icon'))).toHaveLength(2);
    expect(window.alert).toHaveBeenCalledTimes(0);

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton-original');
    await userEvent.click(addNoteButton);
    await userEvent.click(addNoteButton);

    expect(window.alert).toHaveBeenCalledTimes(1);
    expect((await screen.findAllByTestId('note-icon'))).toHaveLength(3);
  });

  test('does not display the activity section nor its anchor if there are no items to show', async () => {
    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="456"
          />
    );

    expect((await screen.queryByTestId('detailView-activitySection'))).toBeNull();
    expect((await screen.queryByTestId('quickLinks-anchor-Activity'))).toBeNull();
  });

  test('displays the activity section and its anchor after adding an item', async () => {
    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="456"
          />
    );

    expect((await screen.queryByTestId('detailView-activitySection'))).toBeNull();
    expect((await screen.queryByTestId('quickLinks-anchor-Activity'))).toBeNull();

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton-original');
    await userEvent.click(addNoteButton);

    expect((await screen.findByTestId('detailView-activitySection'))).toBeDefined();
    expect((await screen.findByTestId('quickLinks-anchor-Activity'))).toBeDefined();
  });

  test('does not display neither the history section nor its anchor if the report is new', async () => {
    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="456"
          />
    );

    expect((await screen.queryByTestId('detailView-historySection'))).toBeNull();
    expect((await screen.queryByTestId('quickLinks-anchor-History'))).toBeNull();
  });

  test('displays the history section and its anchor if the report is saved', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.findByTestId('detailView-historySection'))).toBeDefined();
    expect((await screen.findByTestId('quickLinks-anchor-History'))).toBeDefined();
  });

  test('titles an event saved with a blank title after its type, without counting that as a change', async () => {
    state.data.eventStore = { 456: { ...mockReport, title: '' } };

    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="456" />);

    const titleInput = await screen.findByRole('textbox', { name: 'Event title' });

    expect(titleInput.value).not.toBe('');
    expect(titleInput).not.toHaveClass('unsaved');
    expect(within(screen.getByRole('navigation', { name: 'Event navigation' })).getByText(titleInput.value))
      .toHaveAttribute('aria-current', 'page');
  });

  test('leads back through the crumbs of the view it was opened from', async () => {
    renderWithWrapper(
      <ReportDetailView
        formProps={{
          isPatrolReport: true,
          parentCrumbs: [{ label: 'Patrols', to: '/patrols' }, { label: 'Delta Patrol', to: '/patrols/123' }],
        }}
        isNewReport
        newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
        reportId="1234"
      />
    );

    const breadcrumb = await screen.findByRole('navigation', { name: 'Event navigation' });

    expect(within(breadcrumb).getByRole('link', { name: 'Delta Patrol' })).toHaveAttribute('href', '/patrols/123');
    expect(within(breadcrumb).queryByRole('link', { name: 'Events' })).toBeNull();
  });

  test('gives the event it adds a crumb that closes it back into this event', async () => {
    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="456" />);

    const title = (await screen.findByRole('textbox', { name: 'Event title' })).value;
    const [props] = AddItemButtonMock.mock.calls.at(-1);

    expect(props.formProps.parentCrumbs).toEqual([
      { label: 'Events', to: '/events' },
      expect.objectContaining({ label: title, replace: true, to: '/' }),
    ]);
  });

  test('does not show add report button if formProps relationshipButtonDisabled is true', async () => {
    renderWithWrapper(
      <ReportDetailView
            formProps={{ relationshipButtonDisabled: true }}
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="456"
          />
    );

    expect((await screen.queryByTestId('reportManager-addReportButton'))).toBeNull();
  });

  test('does not show add report button if report belongs to a collection', async () => {
    state.data.eventStore = { 456: { ...mockReport, is_contained_in: [{ related_event: { id: '987' } }] } };

    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.queryByTestId('reportManager-addReportButton'))).toBeNull();
  });

  test('does not show add report button if report belongs to patrol', async () => {
    state.data.eventStore = { 456: { ...mockReport, patrols: ['123'] } };

    cleanup();
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.queryByTestId('reportManager-addReportButton'))).toBeNull();
  });

  test('does not show add report button if this is an added report', async () => {
    renderWithWrapper(
      <ReportDetailView
            isAddedReport
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="456"
          />
    );

    expect((await screen.queryByTestId('addItemButton-button'))).toBeNull();
  });

  test('does not show add report button if the report is rendered in a community context', async () => {
    renderWithWrapper(
      <ReportDetailView isCommunity isNewReport={false} reportId="456" />
    );

    expect(screen.queryByTestId('addItemButton-button')).toBeNull();
  });

  test('gives the details section the community input value it receives', async () => {
    state.data.eventTypes = [...eventTypes, snareV2];
    state.data.eventSchemas = { ...eventSchemas, [snareV2.value]: { 792: attachmentSchemaV2 } };
    state.data.eventStore = {
      ...state.data.eventStore,
      792: { ...mockReport, event_details: {}, event_type: snareV2.value, id: '792' },
    };
    uploadFile.mockImplementation(() => () => 'test-upload-id');

    renderWithWrapper(
      <ReportDetailView communityInputValue="test-community-input" isCommunity isNewReport={false} reportId="792" />
    );
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await userEvent.upload(
      await screen.findByTestId('schema-form-attachment-field-attachment_field-file-input'),
      file
    );

    expect(uploadFile).toHaveBeenCalledWith(file, 'test-community-input');
  });

  test('shows the add report button', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.findByTestId('addItemButton-button'))).toBeDefined();
  });

  test('sets the locally edited report', async () => {
    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="456" />);

    const titleInput = await screen.findByRole('textbox', { name: 'Event title' });
    await userEvent.type(titleInput, '2');
    titleInput.blur();

    await waitFor(() => {
      expect(setLocallyEditedEvent).toHaveBeenCalledTimes(1);
      expect(setLocallyEditedEvent.mock.calls[0][0].id).toBe('456');
    });
  });

  test('unsets the locally edited report', async () => {
    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="456" />);

    expect(unsetLocallyEditedEvent).toHaveBeenCalledTimes(1);

    const titleInput = await screen.findByRole('textbox', { name: 'Event title' });
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, '2');
    titleInput.blur();

    await waitFor(() => {
      expect(setLocallyEditedEvent).toHaveBeenCalledTimes(1);
    });

    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'title');
    titleInput.blur();

    await waitFor(() => {
      expect(unsetLocallyEditedEvent.mock.invocationCallOrder.at(-1))
        .toBeGreaterThan(setLocallyEditedEvent.mock.invocationCallOrder.at(-1));
    });
  });

  test('clicking "save and resolve" to update both the state and form data', async () => {
    const onSaveSuccess = jest.fn();


    renderWithWrapper(
      <ReportDetailView
          formProps={{ onSaveSuccess }}
          isNewReport
          newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
        />
    );

    const titleTextBox = await screen.findByRole('textbox', { name: 'Event title' });
    await userEvent.clear(titleTextBox);
    await userEvent.type(titleTextBox, '2');
    await userEvent.tab();

    await userEvent.click(await screen.findByRole('button', { name: 'More save options' }));

    expect(generateSaveActionsForReportLikeObject).not.toHaveBeenCalled();

    await userEvent.click(await screen.findByRole('menuitem', { name: 'Save and resolve' }));

    await waitFor(() => {
      expect(onSaveSuccess).toHaveBeenCalledTimes(1);
      expect(generateSaveActionsForReportLikeObject).toHaveBeenCalledTimes(1);

      const changes = generateSaveActionsForReportLikeObject.mock.calls[0][0];

      expect(changes.state).toBe('resolved');
      expect(changes.title).toBe('2');
    });
  });

  test('applies the community styles to the container when the report is shown in the community page', async () => {
    renderWithWrapper(<ReportDetailView isCommunity isNewReport={false} reportId="456" />);

    expect(await screen.findByTestId('reportManagerContainer')).toHaveClass(styles.community);
  });

  test('does not apply the community styles to the container otherwise', async () => {
    renderWithWrapper(<ReportDetailView isCommunity={false} isNewReport={false} reportId="456" />);

    expect(await screen.findByTestId('reportManagerContainer')).not.toHaveClass(styles.community);
  });

  describe('the warning prompt', () => {
    let actualUseNavigate;
    const modalPromptTitle = 'Unsaved Changes';
    const modalPromptText = 'There are unsaved changes. Would you like to go back, discard the changes, or save and continue?';

    beforeEach(() => {
      actualUseNavigate = jest.requireActual('../../../../hooks/useNavigate');
      useNavigate.mockImplementation(actualUseNavigate.default);

    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('showing a warning prompt for unsaved changes', async () => {
      const onCancelAddedReport = jest.fn();

      renderWithWrapper(
        <ReportDetailView formProps={{ onCancelAddedReport }} isNewReport={false} reportId="456" />,
      );

      const titleInput = await screen.findByRole('textbox', { name: 'Event title' });
      await userEvent.type(titleInput, '2');
      titleInput.blur();

      await userEvent.click(screen.getByRole('link', { name: 'Events' }));

      await screen.findByText(modalPromptTitle);
      await screen.findByText(modalPromptText);
    });

    test('showing a warning prompt for an added report', async () => {
      const onCancelAddedReport = jest.fn();

      renderWithWrapper(
        <ReportDetailView
            isAddedReport
            isNewReport
            formProps={{ onCancelAddedReport }}
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="1234"
          />
      );

      expect(onCancelAddedReport).toHaveBeenCalledTimes(0);

      const cancelButton = await screen.findByText('Cancel');
      await userEvent.click(cancelButton);

      await screen.findByText(modalPromptTitle);
      await screen.findByText(modalPromptText);
    });

    test('discarding unsaved changes', async () => {
      const onCancelAddedReport = jest.fn();

      renderWithWrapper(
        <ReportDetailView
            isAddedReport
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            formProps={{ onCancelAddedReport }}
            reportId="1234"
          />
      );

      expect(onCancelAddedReport).toHaveBeenCalledTimes(0);

      const cancelButton = await screen.findByText('Cancel');
      await userEvent.click(cancelButton);

      const discardButton = await screen.findByText('Discard');
      discardButton.click();

      expect(onCancelAddedReport).toHaveBeenCalledTimes(1);
    });

    test('saving unsaved changes', async () => {
      const onSaveSuccess = jest.fn();

      renderWithWrapper(
        <ReportDetailView
            formProps={{ onSaveSuccess }}
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="456"
          />
      );

      const titleTextBox = await screen.findByRole('textbox', { name: 'Event title' });
      await userEvent.type(titleTextBox, '2');
      await userEvent.tab();

      await userEvent.click(screen.getByRole('link', { name: 'Events' }));

      expect(onSaveSuccess).not.toHaveBeenCalled();

      await screen.findByText(modalPromptTitle);
      await screen.findByText(modalPromptText);

      const promptSaveBtn = await screen.findByTestId('navigation-prompt-positive-continue-btn');
      promptSaveBtn.click();

      await new Promise(res => setTimeout(() => {
        expect(onSaveSuccess).toHaveBeenCalledTimes(1);
        res();
      }));
    });
  });
});
