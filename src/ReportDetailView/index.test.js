import React from 'react';
import { Provider } from 'react-redux';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useSearchParams } from 'react-router-dom';

import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { executeSaveActions } from '../utils/save';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import ReportDetailView from './';
import { ReportsTabContext } from '../SideBar/ReportsTab';
import { TAB_KEYS } from '../constants';
import useNavigate from '../hooks/useNavigate';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('../hooks/useNavigate', () => jest.fn());

jest.mock('../utils/save', () => ({
  ...jest.requireActual('../utils/save'),
  executeSaveActions: jest.fn(),
}));

describe('ReportDetailView', () => {
  let executeSaveActionsMock, navigate, useNavigateMock, store, useLocationMock, useSearchParamsMock;

  beforeEach(() => {
    executeSaveActionsMock = jest.fn(() => Promise.resolve());
    executeSaveActions.mockImplementation(executeSaveActionsMock);
    useLocationMock = jest.fn(() => ({ pathname: '/reports/new', state: {} }),);
    useLocation.mockImplementation(useLocationMock);
    useSearchParamsMock = jest.fn(() => ([new URLSearchParams({
      reportType: 'd0884b8c-4ecb-45da-841d-f2f8d6246abf',
      temporalId: '1234',
    })]));
    useSearchParams.mockImplementation(useSearchParamsMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    store = {
      data: { eventStore: {}, eventTypes, patrolTypes },
      view: { fullScreenImage: {}, sideBar: {} },
    };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('redirects to /reports if user tries to create a new report with an invalid reportType', async () => {
    useSearchParamsMock = jest.fn(() => ([new URLSearchParams({ reportType: 'invalid' })]));
    useSearchParams.mockImplementation(useSearchParamsMock);

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
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
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/reports', { replace: true });
    });
  });

  test('updates the title when user types in it', async () => {
    const titleInput = await screen.findByTestId('reportDetailView-header-title');

    expect(titleInput).toHaveTextContent('Jenae Test Auto Resolve');

    userEvent.type(titleInput, '2');

    expect(titleInput).toHaveTextContent('2enae Test Auto Resolve');
  });

  test('hides the detail view when clicking the cancel button', async () => {
    expect(navigate).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(`/${TAB_KEYS.REPORTS}`);
  });

  test('displays a new attachment', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);

    const addAttachmentButton = await screen.findByTestId('reportDetailView-addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(2);
  });

  test('deletes a new attachment', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);

    const addAttachmentButton = await screen.findByTestId('reportDetailView-addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);
    const deleteAttachmentButton = await screen.findByText('trash-can.svg');
    userEvent.click(deleteAttachmentButton);

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);
  });

  test('displays a new note', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton');
    userEvent.click(addNoteButton);

    expect((await screen.findAllByText('note.svg'))).toHaveLength(2);
  });

  test('deletes a new note', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton');
    userEvent.click(addNoteButton);
    const deleteNoteButton = await screen.findByText('trash-can.svg');
    userEvent.click(deleteNoteButton);

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);
  });

  test('disables the save button if user has not changed the opened report', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByText('Save'))).toBeDisabled();
  });

  test('enables the save button if users modified the opened report', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const titleInput = await screen.findByTestId('reportDetailView-header-title');
    userEvent.type(titleInput, '2');
    titleInput.blur();

    expect(await screen.findByText('Save')).not.toBeDisabled();
  });

  test('enables the save button if user adds an attachment', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const addAttachmentButton = await screen.findByTestId('reportDetailView-addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);

    expect(await screen.findByText('Save')).not.toBeDisabled();
  });

  test('keeps the save button disabled if user adds a note without saving', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton');
    userEvent.click(addNoteButton);

    expect(await screen.findByText('Save')).toBeDisabled();
  });

  test('enables the save button if user adds a note, edits it and saves it', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton');
    userEvent.click(addNoteButton);
    const noteTextArea = await screen.findByTestId('reportDetailView-activitySection-noteTextArea-');
    userEvent.type(noteTextArea, 'note...');
    const saveNoteButton = await screen.findByText('Save Note');
    userEvent.click(saveNoteButton);

    expect(await screen.findByText('Save')).not.toBeDisabled();
  });

  test('executes save actions when clicking save and navigates to report feed', async () => {
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
    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(await screen.findByText('Saving...')).toBeDefined();
  });

  test('shows the error messages if the saving action fails', async () => {
    executeSaveActionsMock = jest.fn(() => Promise.reject());
    executeSaveActions.mockImplementation(executeSaveActionsMock);

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(await screen.findByText('Error saving report.')).toBeDefined();
  });

  test('omits duplicated attachment files', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);
    window.alert = jest.fn();

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(1);

    const addAttachmentButton = await screen.findByTestId('reportDetailView-addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(2);

    const fakeFileAgain = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFileAgain);

    expect((await screen.findAllByText('attachment.svg'))).toHaveLength(2);
  });

  test('displays a new note', async () => {
    window.alert = jest.fn();
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findAllByText('note.svg'))).toHaveLength(1);
    expect(window.alert).toHaveBeenCalledTimes(0);

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton');
    userEvent.click(addNoteButton);
    userEvent.click(addNoteButton);

    expect(window.alert).toHaveBeenCalledTimes(1);
    expect((await screen.findAllByText('note.svg'))).toHaveLength(2);
  });

  test('does not display neither the activity section nor its anchor if there are no items to show', async () => {
    expect((await screen.queryByTestId('reportDetailView-activitySection'))).toBeNull();
    expect((await screen.queryByTestId('reportDetailView-quickLinkAnchors-activityAnchor'))).toBeNull();
  });

  test('displays the activity section and its anchor after adding an item', async () => {
    expect((await screen.queryByTestId('reportDetailView-activitySection'))).toBeNull();
    expect((await screen.queryByTestId('reportDetailView-quickLinkAnchors-activityAnchor'))).toBeNull();

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton');
    userEvent.click(addNoteButton);

    expect((await screen.findByTestId('reportDetailView-activitySection'))).toBeDefined();
    expect((await screen.findByTestId('reportDetailView-quickLinkAnchors-activityAnchor'))).toBeDefined();
  });

  test('does not display neither the history section nor its anchor if the report is new', async () => {
    expect((await screen.queryByTestId('reportDetailView-historySection'))).toBeNull();
    expect((await screen.queryByTestId('reportDetailView-quickLinkAnchors-historyAnchor'))).toBeNull();
  });

  test('displays the history section and its anchor if the report is saved', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findByTestId('reportDetailView-historySection'))).toBeDefined();
    expect((await screen.findByTestId('reportDetailView-quickLinkAnchors-historyAnchor'))).toBeDefined();
  });

  test('does not show add report button if report belongs to a collection', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { is_contained_in: ['collection'], id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByTestId('reportDetailView-addReportButton'))).toBeNull();
  });

  test('does not show add report button if report belongs to patrol', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', patrols: ['patrol'], priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByTestId('reportDetailView-addReportButton'))).toBeNull();
  });

  test('shows the add report button', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/456', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 456: { id: '456', priority: 0, title: 'title' } };

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportDetailView />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findByTestId('reportDetailView-addReportButton'))).toBeDefined();
  });
});
