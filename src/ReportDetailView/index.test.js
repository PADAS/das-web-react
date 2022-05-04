import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import ReportDetailView from './';
import { ReportsTabContext } from '../SideBar/ReportsTab';
import { TAB_KEYS } from '../constants';
import useNavigate from '../hooks/useNavigate';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '/reports/new',
    state: {},
  }),
  useSearchParams: () => ([new URLSearchParams({ reportType: 'd0884b8c-4ecb-45da-841d-f2f8d6246abf' })]),
}));

jest.mock('../hooks/useNavigate', () => jest.fn());

describe('ReportDetailView', () => {
  let navigate, useNavigateMock, store;

  beforeEach(() => {
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
    const titleInput = (await screen.findAllByRole('textbox'))[0];

    expect(titleInput).toHaveAttribute('value', 'Jenae Test Auto Resolve');

    userEvent.type(titleInput, '2');

    expect(titleInput).toHaveAttribute('value', 'Jenae Test Auto Resolve2');
  });

  test('hides the detail view when clicking the cancel button', async () => {
    expect(navigate).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(`/${TAB_KEYS.REPORTS}`);
  });

  test('renders the save and cancel buttons when user is in the Details tab', async () => {
    expect((await screen.findByText('Save'))).toBeDefined();
    expect((await screen.findByText('Cancel'))).toBeDefined();
  });

  test('does not render the save and cancel buttons when user is in the Notes tab', async () => {
    const notesTab = (await screen.findAllByRole('tab'))[1];
    userEvent.click(notesTab);

    expect((await screen.queryByText('Save'))).toBeNull();
    expect((await screen.queryByText('Cancel'))).toBeNull();
  });

  test('does not render the save and cancel buttons when user is in the Attachemts tab', async () => {
    const attachemtsTab = (await screen.findAllByRole('tab'))[2];
    userEvent.click(attachemtsTab);

    expect((await screen.queryByText('Save'))).toBeNull();
    expect((await screen.queryByText('Cancel'))).toBeNull();
  });

  test('does not render the save and cancel buttons when user is in the History tab', async () => {
    const historyTab = (await screen.findAllByRole('tab'))[3];
    userEvent.click(historyTab);

    expect((await screen.queryByText('Save'))).toBeNull();
    expect((await screen.queryByText('Cancel'))).toBeNull();
  });
});
