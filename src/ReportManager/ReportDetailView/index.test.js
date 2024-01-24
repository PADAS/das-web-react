import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { point } from '@turf/helpers';
import { Provider } from 'react-redux';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import AddItemButton from '../../AddItemButton';
import { addEventToIncident, createEvent, fetchEvent } from '../../ducks/events';
import { activePatrol } from '../../__test-helpers/fixtures/patrols';
import { createMapMock } from '../../__test-helpers/mocks';
import { eventSchemas } from '../../__test-helpers/fixtures/event-schemas';
import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import { executeSaveActions, generateSaveActionsForReportLikeObject } from '../../utils/save';
import { TrackerContext } from '../../utils/analytics';
import { fetchEventTypeSchema } from '../../ducks/event-schemas';
import { GPS_FORMATS } from '../../utils/location';
import i18n from '../../i18nForTests';
import { MapContext } from '../../App';
import NavigationContextProvider from '../../NavigationContextProvider';
import { mockStore } from '../../__test-helpers/MockStore';
import { PATROLS_API_URL } from '../../ducks/patrols';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import ReportDetailView from './';
import { setLocallyEditedEvent, unsetLocallyEditedEvent } from '../../ducks/locally-edited-event';
import { TAB_KEYS } from '../../constants';
import useNavigate from '../../hooks/useNavigate';
import { notes } from '../../__test-helpers/fixtures/reports';
import { SidebarScrollProvider } from '../../SidebarScrollContext';
import { cleanup, render, screen, waitFor, within } from '../../test-utils';

jest.mock('../../AddItemButton', () => jest.fn());

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => () => null, /* eslint-disable-line react/display-name */
}));

jest.mock('../../hooks/useNavigate', () => jest.fn());

jest.mock('../../ducks/events', () => ({
  ...jest.requireActual('../../ducks/events'),
  addEventToIncident: jest.fn(),
  createEvent: jest.fn(),
  fetchEvent: jest.fn(),
}));

jest.mock('../../ducks/locally-edited-event', () => ({
  ...jest.requireActual('../../ducks/locally-edited-event'),
  setLocallyEditedEvent: jest.fn(),
  unsetLocallyEditedEvent: jest.fn(),
}));

jest.mock('../../ducks/event-schemas', () => ({
  ...jest.requireActual('../../ducks/event-schemas'),
  fetchEventTypeSchema: jest.fn(),
}));

jest.mock('../../utils/save', () => ({
  ...jest.requireActual('../../utils/save'),
  generateSaveActionsForReportLikeObject: jest.fn(),
  executeSaveActions: jest.fn(),
}));

const server = setupServer(
  rest.get(`${PATROLS_API_URL}:id`, (req, res, ctx) => res(ctx.json({ data: { data: activePatrol } }))),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ReportManager - ReportDetailView', () => {
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
    generateSaveActionsForReportLikeObjectMock = jest.requireActual('../../utils/save').generateSaveActionsForReportLikeObject;
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
      <I18nextProvider i18n={i18n}>
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
      </I18nextProvider>
    </Provider>;

    state = {
      data: {
        subjectStore: {},
        eventStore: { 456: mockReportWithNotes, 123: mockReport },
        eventTypes,
        patrolTypes,
        eventSchemas,
        patrolStore: { 123: activePatrol },
        tracks: {},
      },
      view: {
        featureFlagOverrides: {},
        mapLocationSelection: { isPickingLocation: false },
        sideBar: {},
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

  test('fetches the event schema if it is not loaded already', async () => {
    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="74941f0d-4b89-48be-a62a-a74c78db8383"
            reportId="1234"
          />
    );

    expect(fetchEventTypeSchema).toHaveBeenCalled();
    expect(fetchEventTypeSchema).toHaveBeenCalledWith('fire_rep', undefined);
  });

  test('updates the title when user types in it', async () => {
    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="1234"
          />
    );

    const titleInput = await screen.findByTestId('reportManager-header-title');

    expect(titleInput).toHaveTextContent('Accident');

    userEvent.type(titleInput, '2');

    expect(titleInput).toHaveTextContent('2ccident');
  });

  test('sets the location when user changes it', async () => {
    renderWithWrapper(
      <ReportDetailView
              isNewReport
              newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
              reportId="1234"
            />
    );

    const setLocationButton = await screen.findByTestId('set-location-button');
    userEvent.click(setLocationButton);
    const placeMarkerOnMapButton = await screen.findByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });

    expect((await screen.findByText('55.000000°, 88.000000°'))).toBeDefined();
  });

  test('sets the date when user changes it', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    const datePickerInput = await screen.findByTestId('datePicker-input');
    userEvent.click(datePickerInput);
    const options = await screen.findAllByRole('option');
    userEvent.click(options[25]);

    expect(datePickerInput).toHaveAttribute('value', '2022/12/22');
  });

  test('sets the time when user changes it', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);
    const optionsList = await screen.findByTestId('timePicker-OptionsList');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');
    userEvent.click(timeOptionsListItems[2]);

    expect(timeInput).toHaveAttribute('value', '00:30');
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
    userEvent.type(typeOfAccidentField, 'Truck crash');

    expect((await screen.findByDisplayValue('Truck crash'))).toBeDefined();
  });

  test('sets the state when user changes it', async () => {
    renderWithWrapper(
      <ReportDetailView
              isNewReport
              newReportTypeId="d0884b8c-4ecb-45da-841d-f2f8d6246abf"
              reportId="1234"
            />
    );

    expect((await screen.queryByRole('button', { name: 'Resolved' }))).toBeNull();

    const stateDropdown = await screen.findByText('active');
    userEvent.click(stateDropdown);
    const resolvedItem = await screen.findByText('resolved');
    userEvent.click(resolvedItem);

    expect(((await screen.findAllByRole('button', { name: 'resolved' })))[0]).toHaveClass('dropdown-toggle');
  });

  test('hides the detail view when clicking the cancel button', async () => {
    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="1234"
          />
    );

    expect(navigate).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(`/${TAB_KEYS.REPORTS}`);
  });

  test('showing the navigation warning prompt when canceling an added report', () => {

  });

  test('displays a new attachment', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);

    const addAttachmentButton = await screen.findByTestId('addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(2);
  });

  test('deletes a new attachment', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);

    const addAttachmentButton = await screen.findByTestId('addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);
    const deleteAttachmentButton = await screen.findByText('trash-can.svg');
    userEvent.click(deleteAttachmentButton);

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);
  });

  test('displays a new note', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.findAllByText('note.svg'))).toHaveLength(notes.length + 1);

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton-original');
    userEvent.click(addNoteButton);

    expect((await screen.findAllByText('note.svg'))).toHaveLength(notes.length + 2);
  });

  test('deletes a new note', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="123" />
    );

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton-original');
    userEvent.click(addNoteButton);
    const deleteNoteButton = await screen.findByText('trash-can.svg');
    userEvent.click(deleteNoteButton);

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);
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
      expect(navigate).toHaveBeenCalledWith('/reports/incident', { state: { relatedEvent: initialReport.id }, replace: true });
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

    const titleTextBox = await screen.findByTestId('reportManager-header-title');
    userEvent.type(titleTextBox, '2');
    userEvent.tab();

    expect(onSaveSuccess).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

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

    const titleTextBox = await screen.findByTestId('reportManager-header-title');
    userEvent.type(titleTextBox, '2');
    userEvent.tab();

    expect(executeSaveActions).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(executeSaveActions).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(`/${TAB_KEYS.REPORTS}`);
    });
  });

  const renderAndAssertNoteEdition = async (updatedText, noteId) => {
    renderWithWrapper(
      <ReportDetailView
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="456"
        />
    );
    const editNoteIcon = await screen.findByTestId(`activitySection-editIcon-${noteId}`);
    userEvent.click(editNoteIcon);

    const noteTextArea = await screen.findByTestId(`activitySection-noteTextArea-${noteId}`);
    userEvent.type(noteTextArea, updatedText);

    const doneNoteButton = await screen.findByTestId(`activitySection-noteDone-${noteId}`);
    userEvent.click(doneNoteButton);

    const textArea = await screen.findByTestId(`activitySection-noteTextArea-${noteId}`);
    return { textArea, doneNoteButton };
  };

  test('user can cancel the edit of a note', async () => {
    const [note] = notes;
    const updatedText = 'edition';

    const { textArea, doneNoteButton } = await renderAndAssertNoteEdition(updatedText, note.id);

    expect(textArea).toHaveValue(`${note.text}${updatedText}`);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(textArea).toHaveTextContent(note.text);
    expect((await screen.queryByText(doneNoteButton))).toBeNull();
  });

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

  test('shows the loading overlay while saving', async () => {
    renderWithWrapper(
      <ReportDetailView
            isNewReport
            newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
            reportId="456"
          />
    );

    const titleTextBox = await screen.findByTestId('reportManager-header-title');
    userEvent.type(titleTextBox, '2');
    userEvent.tab();
    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(await screen.findByText('Saving...')).toBeDefined();
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

    const titleTextBox = await screen.findByTestId('reportManager-header-title');
    userEvent.type(titleTextBox, '2');
    userEvent.tab();

    expect(onSaveError).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

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

    const titleTextBox = await screen.findByTestId('reportManager-header-title');
    userEvent.type(titleTextBox, '2');
    userEvent.tab();
    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(await screen.findByText('Error saving report.')).toBeDefined();
  });

  test('omits duplicated attachment files', async () => {
    window.alert = jest.fn();

    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);

    const addAttachmentButton = await screen.findByTestId('addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(2);

    const fakeFileAgain = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFileAgain);

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(2);
  });

  test('can not add a second note without saving the first one', async () => {
    window.alert = jest.fn();

    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.findAllByText('note.svg'))).toHaveLength(3);
    expect(window.alert).toHaveBeenCalledTimes(0);

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton-original');
    userEvent.click(addNoteButton);
    userEvent.click(addNoteButton);

    expect(window.alert).toHaveBeenCalledTimes(1);
    expect((await screen.findAllByText('note.svg'))).toHaveLength(4);
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
    userEvent.click(addNoteButton);

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

  test('shows the add report button', async () => {
    renderWithWrapper(
      <ReportDetailView isNewReport={false} reportId="456" />
    );

    expect((await screen.findByTestId('addItemButton-button'))).toBeDefined();
  });

  test('sets the locally edited report', async () => {
    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="456" />);

    const titleInput = await screen.findByTestId('reportManager-header-title');
    userEvent.type(titleInput, '2');
    titleInput.blur();

    await waitFor(() => {
      expect(setLocallyEditedEvent).toHaveBeenCalledTimes(1);
      expect(setLocallyEditedEvent.mock.calls[0][0].id).toBe('456');
    });
  });

  test('unsets the locally edited report', async () => {
    renderWithWrapper(<ReportDetailView isNewReport={false} reportId="456" />);

    expect(unsetLocallyEditedEvent).toHaveBeenCalledTimes(1);

    const titleInput = await screen.findByTestId('reportManager-header-title');
    userEvent.type(titleInput, '2');
    titleInput.blur();

    await waitFor(() => {
      expect(setLocallyEditedEvent).toHaveBeenCalledTimes(1);
    });

    userEvent.type(titleInput, 't');
    titleInput.blur();

    await waitFor(() => {
      expect(unsetLocallyEditedEvent).toHaveBeenCalledTimes(2);
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

    const titleTextBox = await screen.findByTestId('reportManager-header-title');
    userEvent.type(titleTextBox, '2');
    userEvent.tab();


    const saveButtonGroup = await screen.findByRole('group');
    expect(saveButtonGroup).toHaveTextContent('Save');

    const saveBtnDropdownToggle = saveButtonGroup.querySelector('.dropdown-toggle');
    saveBtnDropdownToggle.click();

    const saveAndResolveBtn = await screen.findByText('Save and resolve');

    expect(generateSaveActionsForReportLikeObject).not.toHaveBeenCalled();

    saveAndResolveBtn.click();

    await waitFor(() => {
      expect(onSaveSuccess).toHaveBeenCalledTimes(1);
      expect(generateSaveActionsForReportLikeObject).toHaveBeenCalledTimes(1);

      const changes = generateSaveActionsForReportLikeObject.mock.calls[0][0];

      expect(changes.state).toBe('resolved');
      expect(changes.title).toBe('2ccident');
    });
  });

  describe('the warning prompt', () => {
    let actualUseNavigate;
    const modalPromptTitle = 'Unsaved Changes';
    const modalPromptText = 'There are unsaved changes. Would you like to go back, discard the changes, or save and continue?';

    beforeEach(() => {
      actualUseNavigate = jest.requireActual('../../hooks/useNavigate');
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

      const titleInput = await screen.findByTestId('reportManager-header-title');
      userEvent.type(titleInput, '2');
      titleInput.blur();

      const cancelButton = await screen.findByText('Cancel');
      userEvent.click(cancelButton);

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
      userEvent.click(cancelButton);

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
      userEvent.click(cancelButton);

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

      const titleTextBox = await screen.findByTestId('reportManager-header-title');
      userEvent.type(titleTextBox, '2');
      userEvent.tab();


      const cancelButton = await screen.findByText('Cancel');
      userEvent.click(cancelButton);

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
