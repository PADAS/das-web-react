import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor, within } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation, useSearchParams } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import AddReport from '../AddReport';
import { createMapMock } from '../__test-helpers/mocks';
import { executeSaveActions } from '../utils/save';
import { EVENT_API_URL } from '../ducks/events';
import { PATROLS_API_URL } from '../ducks/patrols';
import { GPS_FORMATS } from '../utils/location';
import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import { patrolDefaultStoreData, scheduledPatrol } from '../__test-helpers/fixtures/patrols';
import PatrolDetailView from './';
import { TAB_KEYS } from '../constants';
import { TrackerContext } from '../utils/analytics';
import useNavigate from '../hooks/useNavigate';
import { notes } from '../__test-helpers/fixtures/reports';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('../AddReport', () => jest.fn());

jest.mock('../hooks/useNavigate', () => jest.fn());

jest.mock('../utils/save', () => ({
  ...jest.requireActual('../utils/save'),
  executeSaveActions: jest.fn(),
}));

const server = setupServer(
  rest.get(
    `${PATROLS_API_URL}:id`, (req, res, ctx) => res(ctx.json({ data: scheduledPatrol }))
  ),
  rest.patch(
    `${EVENT_API_URL}:id`, (req, res, ctx) => res(ctx.json({ data: {} }))
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('PatrolDetailView', () => {
  const user = {
    username: 'admin',
    first_name: 'DAS',
    last_name: 'Admin',
    id: '3880239a-ffcd-47a8-9035-0ce3c9d90bdd',
    content_type: 'accounts.user'
  };
  const mockPatrol = {
    id: '123',
    priority: 0,
    state: 'open',
    objective: null,
    serial_number: 1595,
    title: 'The great patrol',
    files: [],
    notes: notes,
    patrol_segments: [
      {
        id: '123',
        patrol_type: 'The_Great_Patrol',
        leader: {
          content_type: 'observations.subject',
          id: '456',
          name: 'Alex',
          subject_type: 'person',
          subject_subtype: 'ranger',
          common_name: null,
          additional: {},
          created_at: '2021-08-31T14:42:06.701541-07:00',
          updated_at: '2021-08-31T14:42:06.701557-07:00',
          is_active: true,
          tracks_available: false,
          image_url: '/static/ranger-black.svg'
        },
        scheduled_start: null,
        scheduled_end: '2022-01-08T10:17:00-08:00',
        time_range: {
          start_time: '2022-01-18T13:42:39.502000-08:00',
          end_time: null
        },
        start_location: null,
        end_location: null,
        events: [],
        image_url: 'https://develop.pamdas.org/static/sprite-src/suspicious_person_rep.svg',
        icon_id: 'suspicious_person_rep',
        updates: [],
      },
    ],
    updates: [{
      message: 'Patrol Added',
      time: '2023-04-04T18:41:53.737181+00:00',
      user,
      type: 'add_patrol'
    }],
  };

  let capturedRequestURLs;
  const logRequest = (req) => {
    capturedRequestURLs = [...capturedRequestURLs, req.url.toString()];
  };

  let AddReportMock,
    executeSaveActionsMock,
    map,
    navigate,
    renderWithWrapper,
    store,
    useLocationMock,
    useSearchParamsMock,
    useNavigateMock,
    Wrapper;

  beforeEach(() => {
    AddReportMock = jest.fn(() => <button data-testid="addReport-button" />);
    AddReport.mockImplementation(AddReportMock);
    navigate = jest.fn();
    executeSaveActionsMock = jest.fn(() => Promise.resolve());
    executeSaveActions.mockImplementation(executeSaveActionsMock);
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/new', state: { temporalId: '1234' } }));
    useLocation.mockImplementation(useLocationMock);
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);
    useSearchParamsMock = jest.fn(() => ([new URLSearchParams({ patrolType: 'dog_patrol' })]));
    useSearchParams.mockImplementation(useSearchParamsMock);

    capturedRequestURLs = [];

    store = patrolDefaultStoreData;
    store.data.patrolStore = { 123: mockPatrol };
    store.data.subjectStore = {};
    store.data.user = { permissions: { patrol: ['change'] } };
    store.view.userPreferences = { gpsFormat: Object.values(GPS_FORMATS)[0] };
    store.view.mapLocationSelection = {};

    map = createMapMock();

    Wrapper = ({ children }) => <Provider store={mockStore(store)}> {/* eslint-disable-line react/display-name */}
      <NavigationWrapper>
        <MapContext.Provider value={map}>
          <TrackerContext.Provider value={{ track: jest.fn() }}>
            {children}
          </TrackerContext.Provider>
        </MapContext.Provider>
      </NavigationWrapper>
    </Provider>;

    renderWithWrapper = (Component, wrapper = Wrapper) => render(Component, { wrapper });
  });

  server.events.on('request:match', (req) => logRequest(req));

  afterEach(() => {
    jest.restoreAllMocks();
    server.events.removeListener('request:match', logRequest);
  });

  test('redirects to /patrols if user tries to create a new patrol with an invalid patrolType', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/new', state: {} }),);
    useLocation.mockImplementation(useLocationMock);
    useSearchParamsMock = jest.fn(() => ([new URLSearchParams({ patrolType: 'invalid' })]));
    useSearchParams.mockImplementation(useSearchParamsMock);

    renderWithWrapper(<PatrolDetailView />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/patrols', { replace: true });
    });
  });

  test('redirects to the same route assignin a temporal id in case it is missing', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/new', search: '?patrolType=1234', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    renderWithWrapper(<PatrolDetailView />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalled();
      expect(navigate.mock.calls[0][0]).toBe('/patrols/new?patrolType=1234');
      expect(navigate.mock.calls[0][1]).toHaveProperty('replace');
      expect(navigate.mock.calls[0][1]).toHaveProperty('state');
      expect(navigate.mock.calls[0][1].state).toHaveProperty('temporalId');
    });
  });

  test('fetches the patrol data if there is an id specified in the URL', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols/456' })));
    useLocation.mockImplementation(useLocationMock);

    renderWithWrapper(<PatrolDetailView />);

    await waitFor(() => {
      expect(capturedRequestURLs.find((item) => item.includes(`${PATROLS_API_URL}456`))).toBeDefined();
    });
  });

  test('does not fetch the patrol data if the id is "new"', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols/new' })));
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 123: scheduledPatrol };
    renderWithWrapper(<PatrolDetailView />);

    await waitFor(() => {
      expect(capturedRequestURLs.find((item) => item.includes(`${PATROLS_API_URL}123`))).not.toBeDefined();
    });
  });

  test('does not fetch the patrol data if it is in the patrol store already', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols/123' })));
    useLocation.mockImplementation(useLocationMock);

    renderWithWrapper(<PatrolDetailView />);

    await waitFor(() => {
      expect(capturedRequestURLs.find((item) => item.includes(`${PATROLS_API_URL}123`))).not.toBeDefined();
    });
  });

  test('updates the title when user types in it', async () => {
    renderWithWrapper(<PatrolDetailView />);

    const titleInput = await screen.findByTestId('patrolDetailView-header-title');

    expect(titleInput).toHaveTextContent('Unknown patrol type');

    userEvent.type(titleInput, '2');

    expect(titleInput).toHaveTextContent('2nknown patrol type');
  });

  test('sets the start location when user changes it', async () => {
    renderWithWrapper(<PatrolDetailView />);

    const setLocationButton = (await screen.findAllByTestId('set-location-button'))[0];
    userEvent.click(setLocationButton);
    const placeMarkerOnMapButton = await screen.findByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });

    expect((await screen.findByText('55.000000°, 88.000000°'))).toBeDefined();
  });

  test('sets the start date when user changes it', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/123' }));
    useLocation.mockImplementation(useLocationMock);

    renderWithWrapper(<PatrolDetailView />);

    const datePickerInput = (await screen.findAllByTestId('datePicker-input'))[0];
    userEvent.click(datePickerInput);
    const options = await screen.findAllByRole('option');
    userEvent.click(options[25]);

    expect(datePickerInput).toHaveAttribute('value', '2022/01/20');
  });

  test('sets the start time when user changes it', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/123' }));
    useLocation.mockImplementation(useLocationMock);

    renderWithWrapper(<PatrolDetailView />);

    const timeInput = (await screen.findAllByTestId('time-input'))[0];
    userEvent.click(timeInput);
    const optionsList = await screen.findByTestId('timePicker-OptionsList');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');
    userEvent.click(timeOptionsListItems[2]);

    expect(timeInput).toHaveAttribute('value', '00:30');
  });

  test('sets the end location when user changes it', async () => {
    renderWithWrapper(<PatrolDetailView />);

    const setLocationButton = (await screen.findAllByTestId('set-location-button'))[1];
    userEvent.click(setLocationButton);
    const placeMarkerOnMapButton = await screen.findByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 56 } });

    expect((await screen.findByText('56.000000°, 88.000000°'))).toBeDefined();
  });

  test('sets the end date when user changes it', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/123' }));
    useLocation.mockImplementation(useLocationMock);

    renderWithWrapper(<PatrolDetailView />);

    const endDatePickerInput = (await screen.findAllByTestId('datePicker-input'))[1];
    userEvent.click(endDatePickerInput);
    const endDateOptions = await screen.findAllByRole('option');
    userEvent.click(endDateOptions[25]);

    const startDatePickerInput = (await screen.findAllByTestId('datePicker-input'))[0];
    userEvent.click(startDatePickerInput);
    const startDateOptions = await screen.findAllByRole('option');
    userEvent.click(startDateOptions[26]);

    expect(endDatePickerInput).toHaveAttribute('value', undefined);
  });

  test('end time is disabled while there is no end date', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/123' }));
    useLocation.mockImplementation(useLocationMock);

    renderWithWrapper(<PatrolDetailView />);

    const timeInput = (await screen.findAllByTestId('time-input'))[1];

    expect(timeInput).toHaveAttribute('disabled');
  });

  test('sets the end time when user changes it', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/123' }));
    useLocation.mockImplementation(useLocationMock);

    renderWithWrapper(<PatrolDetailView />);

    const datePickerInput = (await screen.findAllByTestId('datePicker-input'))[1];
    userEvent.click(datePickerInput);
    const options = await screen.findAllByRole('option');
    userEvent.click(options[25]);

    const timeInput = (await screen.findAllByTestId('time-input'))[1];
    userEvent.click(timeInput);
    const optionsList = await screen.findByTestId('timePicker-OptionsList');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');
    userEvent.click(timeOptionsListItems[2]);

    expect(timeInput).toHaveAttribute('value', '00:30');
  });

  test('sets the objective when user changes it', async () => {
    renderWithWrapper(<PatrolDetailView />);

    const objectiveInput = await screen.getByTestId('patrolDetailView-objectiveTextArea');

    expect(objectiveInput).not.toHaveTextContent('great objective');

    userEvent.type(objectiveInput, 'great objective');

    expect(objectiveInput).toHaveTextContent('great objective');
  });

  test('hides the detail view when clicking the cancel button', async () => {
    renderWithWrapper(<PatrolDetailView />);

    expect(navigate).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(`/${TAB_KEYS.PATROLS}`);
  });

  test('displays a new note', async () => {
    renderWithWrapper(<PatrolDetailView />);

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);

    const addNoteButton = await screen.findByTestId('addNoteButton');
    userEvent.click(addNoteButton);

    expect((await screen.findAllByText('note.svg'))).toHaveLength(2);
  });

  test('deletes a new note', async () => {
    renderWithWrapper(<PatrolDetailView />);

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);

    const addNoteButton = await screen.findByTestId('addNoteButton');
    userEvent.click(addNoteButton);
    const deleteNoteButton = await screen.findByText('trash-can.svg');
    userEvent.click(deleteNoteButton);

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);
  });

  test('executes save actions when clicking save and navigates to patrol feed', async () => {
    renderWithWrapper(<PatrolDetailView />);

    const titleInput = (await screen.findAllByRole('textbox'))[0];
    userEvent.type(titleInput, '2');
    userEvent.tab();

    expect(executeSaveActions).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    await waitFor(() => {
      expect(executeSaveActions).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(`/${TAB_KEYS.PATROLS}`);
    });
  });

  test('shows the loading overlay while saving', async () => {
    renderWithWrapper(<PatrolDetailView />);

    const titleInput = (await screen.findAllByRole('textbox'))[0];
    userEvent.type(titleInput, '2');
    userEvent.tab();
    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(await screen.findByText('Saving...')).toBeDefined();
  });

  test('can not add a second note without saving the first one', async () => {
    window.alert = jest.fn();

    renderWithWrapper(<PatrolDetailView />);

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);
    expect(window.alert).toHaveBeenCalledTimes(0);

    const addNoteButton = await screen.findByTestId('addNoteButton');
    userEvent.click(addNoteButton);
    userEvent.click(addNoteButton);

    expect(window.alert).toHaveBeenCalledTimes(1);
    expect((await screen.findAllByText('note.svg'))).toHaveLength(2);
  });

  test('after adding a report it is added to the patrol segment', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/123' }));
    useLocation.mockImplementation(useLocationMock);

    const addedReport = [{ data: { data: { id: 'added' } } }];

    AddReportMock = ({ formProps }) => { /* eslint-disable-line react/display-name */
      useEffect(() => {
        formProps.onSaveSuccess(addedReport);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null;
    };
    AddReport.mockImplementation(AddReportMock);

    renderWithWrapper(<PatrolDetailView />);

    await waitFor(() => {
      expect(capturedRequestURLs.find((item) => item.includes(`${EVENT_API_URL}added`))).toBeDefined();
      expect(capturedRequestURLs.find((item) => item.includes(`${PATROLS_API_URL}123`))).toBeDefined();
    });
  });

  test('does not display the activity section nor its anchor if there are no items to show', async () => {
    renderWithWrapper(<PatrolDetailView />);

    expect((await screen.queryByTestId('detailView-activitySection'))).toBeNull();
    expect((await screen.queryByTestId('quickLinks-anchor-Activity'))).toBeNull();
  });

  test('displays the activity section and its anchor after adding an item', async () => {
    renderWithWrapper(<PatrolDetailView />);

    expect((await screen.queryByTestId('detailView-activitySection'))).toBeNull();
    expect((await screen.queryByTestId('quickLinks-anchor-Activity'))).toBeNull();

    const addNoteButton = await screen.findByTestId('addNoteButton');
    userEvent.click(addNoteButton);

    expect((await screen.findByTestId('detailView-activitySection'))).toBeDefined();
    expect((await screen.findByTestId('quickLinks-anchor-Activity'))).toBeDefined();
  });

  test('does not display neither the history section nor its anchor if the patrol is new', async () => {
    renderWithWrapper(<PatrolDetailView />);

    expect((await screen.queryByTestId('patrolDetailView-historySection'))).toBeNull();
    expect((await screen.queryByTestId('quickLinks-anchor-History'))).toBeNull();
  });

  test('displays the history section and its anchor if the patrol is saved', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/123' }));
    useLocation.mockImplementation(useLocationMock);

    renderWithWrapper(<PatrolDetailView />);

    expect((await screen.findByTestId('detailView-historySection'))).toBeDefined();
    expect((await screen.findByTestId('quickLinks-anchor-History'))).toBeDefined();
  });

  const renderAndAssertNoteEdition = async (updatedText, noteId) => {
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/123' }));
    useLocation.mockImplementation(useLocationMock);
    renderWithWrapper(<PatrolDetailView/>);

    const editNoteIcon = await screen.findByTestId(`activitySection-editIcon-${noteId}`);
    userEvent.click(editNoteIcon);

    const noteTextArea = await screen.findByTestId(`activitySection-noteTextArea-${noteId}`);
    userEvent.type(noteTextArea, updatedText);

    const doneNoteButton = await screen.findByTestId(`activitySection-noteDone-${noteId}`);
    userEvent.click(doneNoteButton);

    const textArea = await screen.findByTestId(`activitySection-noteTextArea-${noteId}`);
    return { textArea, doneNoteButton, };
  };

  test('user can cancel the edit of a note', async () => {
    const [note] = notes;
    const updatedText = 'edition';
    const { textArea, doneNoteButton } = await renderAndAssertNoteEdition(updatedText, note.id);

    expect(textArea).toHaveValue(`${note.text}${updatedText}`);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(textArea).toHaveTextContent(note.text);
    expect( (await screen.queryByText(doneNoteButton)) ).toBeNull();
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

  describe('the warning prompt', () => {
    let actualUseNavigate;

    beforeEach(() => {
      actualUseNavigate = jest.requireActual('../hooks/useNavigate');
      useNavigate.mockImplementation(actualUseNavigate.default);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('showing a warning prompt for unsaved changes', async () => {
      renderWithWrapper(<PatrolDetailView />);

      const titleInput = await screen.findByTestId('patrolDetailView-header-title');
      userEvent.type(titleInput, '2');
      titleInput.blur();

      const cancelButton = await screen.findByText('Cancel');
      userEvent.click(cancelButton);

      await screen.findByText('Unsaved Changes');
      await screen.findByText('There are unsaved changes. Would you like to go back, discard the changes, or save and continue?');
    });

    test('saving unsaved changes', async () => {
      renderWithWrapper(<PatrolDetailView />);

      const titleTextBox = await screen.findByTestId('patrolDetailView-header-title');
      userEvent.type(titleTextBox, '2');
      userEvent.tab();

      const cancelButton = await screen.findByText('Cancel');
      userEvent.click(cancelButton);

      expect(executeSaveActions).toHaveBeenCalledTimes(0);
      expect(navigate).toHaveBeenCalledTimes(0);

      await screen.findByText('Unsaved Changes');
      await screen.findByText('There are unsaved changes. Would you like to go back, discard the changes, or save and continue?');

      const promptSaveBtn = await screen.findByTestId('navigation-prompt-positive-continue-btn');
      promptSaveBtn.click();

      await waitFor(() => {
        expect(executeSaveActions).toHaveBeenCalledTimes(1);
      });
    });

    test('displays a new attachment', async () => {
      renderWithWrapper(<PatrolDetailView />);

      expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);

      const addAttachmentButton = await screen.findByTestId('addAttachmentButton');
      const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
      userEvent.upload(addAttachmentButton, fakeFile);

      expect((await screen.findAllByText('attachment.svg'))).toHaveLength(2);
    });

    test('deletes a new attachment', async () => {
      renderWithWrapper(<PatrolDetailView />);

      expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);

      const addAttachmentButton = await screen.findByTestId('addAttachmentButton');
      const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
      userEvent.upload(addAttachmentButton, fakeFile);
      const deleteAttachmentButton = await screen.findByText('trash-can.svg');
      userEvent.click(deleteAttachmentButton);

      expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);
    });

    test('omits duplicated attachment files', async () => {
      window.alert = jest.fn();
      renderWithWrapper(<PatrolDetailView />);

      expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);

      const addAttachmentButton = await screen.findByTestId('addAttachmentButton');
      const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
      userEvent.upload(addAttachmentButton, fakeFile);

      expect((await screen.findAllByText('attachment.svg'))).toHaveLength(2);

      const fakeFileAgain = new File(['fake'], 'fake.txt', { type: 'text/plain' });
      userEvent.upload(addAttachmentButton, fakeFileAgain);

      expect((await screen.findAllByText('attachment.svg'))).toHaveLength(2);
    });

  });
});
