import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../../../__test-helpers/MockStore';
import { PREVIEW_FEATURES } from '../../../../constants';
import { render, screen, within } from '../../../../test-utils';
import { report } from '../../../../__test-helpers/fixtures/reports';

import Footer from './';

jest.mock('../../../../DetailViewComponents/AddReportButton', () => {
  const AddReportButton = () => <button type="button">Event</button>;

  return AddReportButton;
});

describe('SideBar - EventsManager - EventOverview - Footer', () => {
  let onAddAttachments, onAddNote, onCancel, onSave, onSaveAndSetState, store;

  beforeEach(() => {
    onAddAttachments = jest.fn();
    onAddNote = jest.fn();
    onCancel = jest.fn();
    onSave = jest.fn();
    onSaveAndSetState = jest.fn();

    store = { data: {}, view: { systemConfig: {} } };
  });

  const renderFooter = (props = {}, storeOverrides = store) => render(
    <Provider store={mockStore(storeOverrides)}>
      <Footer
        onAddAttachments={onAddAttachments}
        onAddNote={onAddNote}
        onSave={onSave}
        onSaveAndSetState={onSaveAndSetState}
        report={report}
        {...props}
      />
    </Provider>
  );

  const openSaveOptions = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'More save options' }));

    return screen.getByRole('menu', { name: 'More save options' });
  };

  test('lets the user add a note', async () => {
    renderFooter();

    await userEvent.click(screen.getByRole('button', { name: 'Add a note' }));

    expect(onAddNote).toHaveBeenCalledTimes(1);
  });

  test('lets the user add an attachment', () => {
    renderFooter();

    expect(screen.getByTestId('addAttachmentButton')).toBeInTheDocument();
  });

  test('shows the add event button when the event can take one', () => {
    renderFooter({ shouldShowAddReportButton: true });

    expect(screen.getByRole('button', { name: 'Event' })).toBeVisible();
  });

  test('does not show the add event button when the event can not take one', () => {
    renderFooter();

    expect(screen.queryByRole('button', { name: 'Event' })).toBeNull();
  });

  test('does not show a cancel button for an event that is not being added anywhere', () => {
    renderFooter();

    expect(screen.queryByRole('button', { name: /Cancel/ })).toBeNull();
  });

  test('cancels adding the event when the user clicks the cancel button', async () => {
    renderFooter({ onCancel });

    const cancelButton = screen.getByRole('button', { name: 'Cancel adding this event' });

    expect(cancelButton).toHaveTextContent('Cancel');
    expect(cancelButton).toHaveAttribute('title', 'Cancel adding this event');

    await userEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('locks cancelling and adding to the event while it saves', () => {
    renderFooter({ isSaving: true, onCancel, shouldShowAddReportButton: true });

    expect(screen.getByRole('button', { name: 'Cancel adding this event' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add a note' }).closest('[inert]')).not.toBeNull();
  });

  test('saves when the user clicks the save button', async () => {
    renderFooter();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test('shows the save in progress on the save button', () => {
    renderFooter({ isSaving: true });

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  test('offers to save and resolve an active event', async () => {
    renderFooter();

    const menu = await openSaveOptions();

    expect(within(menu).getAllByRole('menuitem').map((option) => option.textContent)).toEqual(['Save and resolve']);
  });

  test('offers to save and send to review an active event when community input is enabled', async () => {
    renderFooter({}, {
      ...store,
      view: { systemConfig: { previewFeatures: { [PREVIEW_FEATURES.COMMUNITY_INPUT_ADMIN]: true } } },
    });

    const menu = await openSaveOptions();

    expect(within(menu).getAllByRole('menuitem').map((option) => option.textContent))
      .toEqual(['Save and resolve', 'Save and review']);
  });

  test('offers to save and resolve or activate an event in review', async () => {
    renderFooter({ report: { ...report, state: 'review' } });

    const menu = await openSaveOptions();

    expect(within(menu).getAllByRole('menuitem').map((option) => option.textContent))
      .toEqual(['Save and resolve', 'Save and activate']);
  });

  test('offers to save and reopen a resolved event', async () => {
    renderFooter({ report: { ...report, state: 'resolved' } });

    const menu = await openSaveOptions();

    expect(within(menu).getAllByRole('menuitem').map((option) => option.textContent)).toEqual(['Save and reopen']);
  });

  test('saves the event with the state of the option the user picks', async () => {
    renderFooter({ report: { ...report, state: 'resolved' } });

    await openSaveOptions();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Save and reopen' }));

    expect(onSaveAndSetState).toHaveBeenCalledWith('active');
  });

  describe('a community event', () => {
    test('shows a save button without save options', () => {
      renderFooter({ isCommunity: true });

      expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
      expect(screen.queryByRole('button', { name: 'More save options' })).toBeNull();
    });
  });
});
