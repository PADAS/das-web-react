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
    useSearchParamsMock = jest.fn(() => ([new URLSearchParams({ reportType: 'd0884b8c-4ecb-45da-841d-f2f8d6246abf' })]));
    useSearchParams.mockImplementation(useSearchParamsMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    store = {
      data: { eventStore: {}, eventTypes, patrolTypes },
      view: { sideBar: {} },
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

  test('renders the Details view by default', async () => {
    expect((await screen.findAllByRole('tab'))[0]).toHaveClass('active');
    expect((await screen.findAllByRole('tab'))[0]).toHaveTextContent('Details');
    expect((await screen.findAllByRole('tabpanel'))[0]).toHaveClass('show');
  });

  test('navigates to the Notes view when user clicks the tab', async () => {
    const notesTab = (await screen.findAllByRole('tab'))[1];

    expect(notesTab).not.toHaveClass('active');
    expect((await screen.findAllByRole('tab'))[1]).toHaveTextContent('Notes');

    userEvent.click(notesTab);

    expect(notesTab).toHaveClass('active');
    expect(await screen.findByRole('tabpanel')).toHaveClass('show');
  });

  test('navigates to the Attachments view when user clicks the tab', async () => {
    const attachmentsTab = (await screen.findAllByRole('tab'))[2];

    expect(attachmentsTab).not.toHaveClass('active');
    expect((await screen.findAllByRole('tab'))[2]).toHaveTextContent('Attachments');

    userEvent.click(attachmentsTab);

    expect(attachmentsTab).toHaveClass('active');
    expect(await screen.findByRole('tabpanel')).toHaveClass('show');
  });

  test('navigates to the History view when user clicks the tab', async () => {
    const historyTab = (await screen.findAllByRole('tab'))[3];

    expect(historyTab).not.toHaveClass('active');
    expect((await screen.findAllByRole('tab'))[3]).toHaveTextContent('History');

    userEvent.click(historyTab);

    expect(historyTab).toHaveClass('active');
    expect(await screen.findByRole('tabpanel')).toHaveClass('show');
  });


  test('navigates to the History view when user clicks the tab', async () => {
    const historyTab = (await screen.findAllByRole('tab'))[2];

    expect(historyTab).not.toHaveClass('active');

    userEvent.click(historyTab);

    expect(historyTab).toHaveClass('active');
    expect(await screen.findByRole('tabpanel')).toHaveClass('show');
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
});
