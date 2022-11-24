import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddReport from '../../AddReport';
import { addEventToIncident, createEvent, fetchEvent } from '../../ducks/events';
import { createMapMock } from '../../__test-helpers/mocks';
import { eventSchemas } from '../../__test-helpers/fixtures/event-schemas';
import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import { executeSaveActions } from '../../utils/save';
import { fetchEventTypeSchema } from '../../ducks/event-schemas';
import { GPS_FORMATS } from '../../utils/location';
import { MapContext } from '../../App';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import ReportDetailView from './';
import { ReportsTabContext } from '../../SideBar/ReportsTab';
import { TAB_KEYS } from '../../constants';
import useNavigate from '../../hooks/useNavigate';

jest.mock('../../AddReport', () => jest.fn());

jest.mock('../../hooks/useNavigate', () => jest.fn());

jest.mock('../../ducks/events', () => ({
  ...jest.requireActual('../../ducks/events'),
  addEventToIncident: jest.fn(),
  createEvent: jest.fn(),
  fetchEvent: jest.fn(),
}));

jest.mock('../../ducks/event-schemas', () => ({
  ...jest.requireActual('../../ducks/event-schemas'),
  fetchEventTypeSchema: jest.fn(),
}));

jest.mock('../../utils/save', () => ({
  ...jest.requireActual('../../utils/save'),
  executeSaveActions: jest.fn(),
}));

describe('ReportManager - ReportDetailView', () => {
  let AddReportMock,
    addEventToIncidentMock,
    createEventMock,
    executeSaveActionsMock,
    fetchEventMock,
    fetchEventTypeSchemaMock,
    map,
    navigate,
    useNavigateMock,
    store;

  beforeEach(() => {
    AddReportMock = jest.fn(() => null);
    AddReport.mockImplementation(AddReportMock);
    addEventToIncidentMock = jest.fn(() => () => {});
    addEventToIncident.mockImplementation(addEventToIncidentMock);
    createEventMock = jest.fn(() => () => {});
    createEvent.mockImplementation(createEventMock);
    executeSaveActionsMock = jest.fn(() => Promise.resolve());
    executeSaveActions.mockImplementation(executeSaveActionsMock);
    fetchEventMock = jest.fn(() => () => {});
    fetchEvent.mockImplementation(fetchEventMock);
    fetchEventTypeSchemaMock = jest.fn(() => () => {});
    fetchEventTypeSchema.mockImplementation(fetchEventTypeSchemaMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    map = createMapMock();

    store = {
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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('redirects to /reports if user tries to create a new report with an invalid reportType', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport newReportTypeId="invalid" reportId="1234" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/reports', { replace: true });
    });
  });

  test('redirects to /reports if user tries to open a report that cannot be found', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/reports', { replace: true });
    });
  });

  test('does not redirect to /reports if it is an added report', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isAddedReport isNewReport newReportTypeId="invalid" reportId="1234" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect(navigate).toHaveBeenCalledTimes(0);
  });

  test('updates the title when user types in it', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74" reportId="1234" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const titleInput = await screen.findByTestId('reportManager-header-title');

    expect(titleInput).toHaveTextContent('Accident');

    userEvent.type(titleInput, '2');

    expect(titleInput).toHaveTextContent('2ccident');
  });

  test('sets the location when user changes it', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <NavigationWrapper>
            <ReportsTabContext.Provider value={{ loadingEvents: false }}>
              <ReportDetailView isNewReport newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74" reportId="1234" />
            </ReportsTabContext.Provider>
          </NavigationWrapper>
        </MapContext.Provider>
      </Provider>
    );

    const setLocationButton = await screen.findByTestId('set-location-button');
    userEvent.click(setLocationButton);
    const placeMarkerOnMapButton = await screen.findByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });

    expect((await screen.findByText('55.000000°, 88.000000°'))).toBeDefined();
  });

  test('hides the detail view when clicking the cancel button', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74" reportId="1234" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect(navigate).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(`/${TAB_KEYS.REPORTS}`);
  });

  test('triggers onCancelAddedReport when clicking cancel if it is an added report', async () => {
    const onCancelAddedReport = jest.fn();

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView
              isAddedReport
              isNewReport
              newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
              onCancelAddedReport={onCancelAddedReport}
              reportId="1234"
            />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect(onCancelAddedReport).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(onCancelAddedReport).toHaveBeenCalledTimes(1);
  });

  test('displays a new attachment', async () => {
    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);

    const addAttachmentButton = await screen.findByTestId('reportManager-addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(2);
  });

  test('deletes a new attachment', async () => {
    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);

    const addAttachmentButton = await screen.findByTestId('reportManager-addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);
    const deleteAttachmentButton = await screen.findByText('trash-can.svg');
    userEvent.click(deleteAttachmentButton);

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);
  });

  test('displays a new note', async () => {
    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);

    const addNoteButton = await screen.findByTestId('reportManager-addNoteButton');
    userEvent.click(addNoteButton);

    expect((await screen.findAllByText('note.svg'))).toHaveLength(2);
  });

  test('deletes a new note', async () => {
    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);

    const addNoteButton = await screen.findByTestId('reportManager-addNoteButton');
    userEvent.click(addNoteButton);
    const deleteNoteButton = await screen.findByText('trash-can.svg');
    userEvent.click(deleteNoteButton);

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);
  });

  test('triggers onAddReport', async () => {
    const onAddReport = jest.fn();

    AddReportMock = ({ onAddReport }) => { /* eslint-disable-line react/display-name */
      useEffect(() => {
        onAddReport();
      }, []); // eslint-disable-line react-hooks/exhaustive-deps

      return null;
    };
    AddReport.mockImplementation(AddReportMock);


    store.data.eventStore = {
      initial: { event_type: 'jtar', id: 'initial', is_collection: true, priority: 0, title: 'title' },
    };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} onAddReport={onAddReport} reportId="initial" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(onAddReport).toHaveBeenCalledTimes(1);
    });
  });

  test('if the current report is a collection, adding a new one simply appends it', async () => {
    const addedReport = [{ data: { data: { id: 'added' } } }];
    const initialReport = [{ data: { data: { id: 'initial' } } }];

    executeSaveActionsMock = jest.fn(() => Promise.resolve(initialReport));
    executeSaveActions.mockImplementation(executeSaveActionsMock);

    AddReportMock = ({ formProps }) => { /* eslint-disable-line react/display-name */
      useEffect(() => {
        formProps.onSaveSuccess(addedReport);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null;
    };
    AddReport.mockImplementation(AddReportMock);

    fetchEventMock = jest.fn(() => () => initialReport[0]);
    fetchEvent.mockImplementation(fetchEventMock);

    store.data.eventStore = {
      initial: { event_type: 'jtar', id: 'initial', is_collection: true, priority: 0, title: 'title' },
    };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="initial" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(addEventToIncident).toHaveBeenCalledTimes(1);
      expect(addEventToIncident).toHaveBeenCalledWith('added', 'initial');
      expect(fetchEvent).toHaveBeenCalledTimes(1);
      expect(fetchEvent).toHaveBeenCalledWith('initial');
      expect(navigate).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/reports/initial');
    });
  });

  test('if the current report is not a collection, adding a new one creates a collections and appends both', async () => {
    const addedReport = [{ data: { data: { id: 'added' } } }];
    const initialReport = [{ data: { data: { id: 'initial' } } }];
    const incidentCollection = { data: { data: { id: 'incident' } } };

    executeSaveActionsMock = jest.fn(() => Promise.resolve(initialReport));
    executeSaveActions.mockImplementation(executeSaveActionsMock);

    AddReportMock = ({ formProps }) => { /* eslint-disable-line react/display-name */
      useEffect(() => {
        formProps.onSaveSuccess(addedReport);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null;
    };
    AddReport.mockImplementation(AddReportMock);

    createEventMock = jest.fn(() => () => incidentCollection);
    createEvent.mockImplementation(createEventMock);

    fetchEventMock = jest.fn(() => () => incidentCollection);
    fetchEvent.mockImplementation(fetchEventMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74" reportId="1234" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(1);
      expect(addEventToIncident).toHaveBeenCalledTimes(2);
      expect(addEventToIncident).toHaveBeenCalledWith('initial', 'incident');
      expect(addEventToIncident).toHaveBeenCalledWith('added', 'incident');
      expect(fetchEvent).toHaveBeenCalledTimes(1);
      expect(fetchEvent).toHaveBeenCalledWith('incident');
      expect(navigate).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/reports/incident');
    });
  });

  test('disables the save button if user has not changed the opened report', async () => {
    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByText('Save'))).toBeDisabled();
  });

  test('enables the save button if users modified the opened report', async () => {
    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const titleInput = await screen.findByTestId('reportManager-header-title');
    userEvent.type(titleInput, '2');
    titleInput.blur();

    expect(await screen.findByText('Save')).not.toBeDisabled();
  });

  test('enables the save button if user adds an attachment', async () => {
    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const addAttachmentButton = await screen.findByTestId('reportManager-addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);

    expect(await screen.findByText('Save')).not.toBeDisabled();
  });

  test('keeps the save button disabled if user adds a note without saving', async () => {
    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const addNoteButton = await screen.findByTestId('reportManager-addNoteButton');
    userEvent.click(addNoteButton);

    expect(await screen.findByText('Save')).toBeDisabled();
  });

  test('enables the save button if user adds a note, edits it and saves it', async () => {
    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const addNoteButton = await screen.findByTestId('reportManager-addNoteButton');
    userEvent.click(addNoteButton);
    const noteTextArea = await screen.findByTestId('reportManager-activitySection-noteTextArea-');
    userEvent.type(noteTextArea, 'note...');
    const saveNoteButton = await screen.findByText('Save Note');
    userEvent.click(saveNoteButton);

    expect(await screen.findByText('Save')).not.toBeDisabled();
  });

  test('triggers the formProps onSaveSuccess callback if there is a report is saved', async () => {
    const onSaveSuccess = jest.fn();

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView
              formProps={{ onSaveSuccess }}
              isNewReport
              newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
              reportId="456"
            />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect(onSaveSuccess).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    await waitFor(() => {
      expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('executes save actions when clicking save and navigates to report feed', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74" reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect(executeSaveActions).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(executeSaveActions).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(`/${TAB_KEYS.REPORTS}`);
    });
  });

  test('shows the loading overlay while saving', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74" reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(await screen.findByText('Saving...')).toBeDefined();
  });

  test('triggers the formProps onSaveError callback if there is an error saving', async () => {
    const onSaveError = jest.fn();

    executeSaveActionsMock = jest.fn(() => Promise.reject());
    executeSaveActions.mockImplementation(executeSaveActionsMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView
              formProps={{ onSaveError }}
              isNewReport
              newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
              reportId="456"
            />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

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

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74" reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(await screen.findByText('Error saving report.')).toBeDefined();
  });

  test('omits duplicated attachment files', async () => {
    window.alert = jest.fn();

    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);

    const addAttachmentButton = await screen.findByTestId('reportManager-addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(2);

    const fakeFileAgain = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFileAgain);

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(2);
  });

  test('displays a new note', async () => {
    window.alert = jest.fn();

    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);
    expect(window.alert).toHaveBeenCalledTimes(0);

    const addNoteButton = await screen.findByTestId('reportManager-addNoteButton');
    userEvent.click(addNoteButton);
    userEvent.click(addNoteButton);

    expect(window.alert).toHaveBeenCalledTimes(1);
    expect((await screen.findAllByText('note.svg'))).toHaveLength(2);
  });

  test('does not display neither the activity section nor its anchor if there are no items to show', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74" reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByTestId('reportManager-activitySection'))).toBeNull();
    expect((await screen.queryByTestId('reportManager-quickLinks-anchor-Activity'))).toBeNull();
  });

  test('displays the activity section and its anchor after adding an item', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74" reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByTestId('reportManager-activitySection'))).toBeNull();
    expect((await screen.queryByTestId('reportManager-quickLinks-anchor-Activity'))).toBeNull();

    const addNoteButton = await screen.findByTestId('reportManager-addNoteButton');
    userEvent.click(addNoteButton);

    expect((await screen.findByTestId('reportManager-activitySection'))).toBeDefined();
    expect((await screen.findByTestId('reportManager-quickLinks-anchor-Activity'))).toBeDefined();
  });

  test('does not display neither the history section nor its anchor if the report is new', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74" reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByTestId('reportDetailView-historySection'))).toBeNull();
    expect((await screen.queryByTestId('reportManager-quickLinks-anchor-History'))).toBeNull();
  });

  test('displays the history section and its anchor if the report is saved', async () => {
    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findByTestId('reportDetailView-historySection'))).toBeDefined();
    expect((await screen.findByTestId('reportManager-quickLinks-anchor-History'))).toBeDefined();
  });

  test('does not show add report button if formProps relationshipButtonDisabled is true', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView
              formProps={{ relationshipButtonDisabled: true }}
              isNewReport
              newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
              reportId="456"
            />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByTestId('reportManager-addReportButton'))).toBeNull();
  });

  test('does not show add report button if report belongs to a collection', async () => {
    store.data.eventStore = {
      456: { event_type: 'jtar', is_contained_in: ['collection'], id: '456', priority: 0, title: 'title' },
    };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByTestId('reportManager-addReportButton'))).toBeNull();
  });

  test('does not show add report button if report belongs to patrol', async () => {
    store.data.eventStore = {
      456: { event_type: 'jtar', id: '456', patrols: ['patrol'], priority: 0, title: 'title' },
    };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByTestId('reportManager-addReportButton'))).toBeNull();
  });

  test('does not show add report button if this is an added report', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView
              isAddedReport
              isNewReport
              newReportTypeId="6c90e5f5-ae8e-4e7f-a8dd-26e5d2909a74"
              reportId="456"
            />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByTestId('reportManager-addReportButton'))).toBeNull();
  });

  test('shows the add report button', async () => {
    store.data.eventStore = { 456: { event_type: 'jtar', id: '456', priority: 0, title: 'title' } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView isNewReport={false} reportId="456" />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findByTestId('reportManager-addReportButton'))).toBeDefined();
  });
});
