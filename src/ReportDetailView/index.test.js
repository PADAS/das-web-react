import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';
import { hideDetailView } from '../ducks/side-bar';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import { report } from '../__test-helpers/fixtures/reports';
import ReportDetailView from './';

jest.mock('../ducks/side-bar', () => ({
  ...jest.requireActual('../ducks/side-bar'),
  hideDetailView: jest.fn(),
}));

describe('ReportDetailView', () => {
  let hideDetailViewMock, store;

  beforeEach(() => {
    hideDetailViewMock = jest.fn(() => () => {});
    hideDetailView.mockImplementation(hideDetailViewMock);

    store = {
      data: { eventTypes, patrolTypes },
      view: {
        sideBar: {
          data: {
            formProps: {},
            report,
          },
        },
      },
    };

    render(
      <Provider store={mockStore(store)}>
        <ReportDetailView />
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

    expect(titleInput).toHaveAttribute('value', 'Light');

    userEvent.type(titleInput, '2');

    expect(titleInput).toHaveAttribute('value', 'Light2');
  });

  test('hides the detail view when clicking the cancel button', async () => {
    expect(hideDetailView).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(hideDetailView).toHaveBeenCalledTimes(1);
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
