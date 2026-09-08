import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../../../../__test-helpers/MockStore';
import { PERMISSION_KEYS, PERMISSIONS } from '../../../../../constants';
import { render, screen } from '../../../../../test-utils';
import { TrackerContext } from '../../../../../utils/analytics';

import Footer from './';

jest.mock('../../../../../AddItemButton', () => {
  const AddItemButton = ({ label, ...otherProps }) => <button type="button" {...otherProps}>{label}</button>;

  return AddItemButton;
});

const ADD_EVENT_BUTTON_LABEL = 'Report an event on this patrol leg';

describe('SideBar - PatrolsManager - LegManager - LegOverview - Footer', () => {
  const LEG_ID = 'leg-1';
  const PATROL_ID = 'patrol-1';

  const onAddAttachments = jest.fn();
  const onAddNote = jest.fn();
  const onSave = jest.fn();

  let store;
  beforeEach(() => {
    store = {
      data: { user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.UPDATE] } } },
      view: {},
    };
  });

  const renderFooter = (props) => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track: jest.fn() }}>
        <Footer
          addEventFormProps={{}}
          canEditLeg
          disableAddNoteButton={false}
          disableSaveButton
          isLegActive
          isSaving={false}
          legId={LEG_ID}
          onAddAttachments={onAddAttachments}
          onAddNote={onAddNote}
          onSave={onSave}
          patrolId={PATROL_ID}
          {...props}
        />
      </TrackerContext.Provider>
    </Provider>
  );

  test('leads to the edition of the leg', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'Edit' }))
      .toHaveAttribute('href', `/patrols/${PATROL_ID}/legs/${LEG_ID}/edit`);
  });

  test('does not lead to the edition of a leg that cannot be edited', () => {
    renderFooter({ canEditLeg: false });

    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
  });

  test('offers to add a note, an attachment and an event', () => {
    renderFooter();

    expect(screen.getByTestId('addNoteButton')).toBeInTheDocument();
    expect(screen.getByTestId('addAttachmentButton')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ADD_EVENT_BUTTON_LABEL })).toBeInTheDocument();
  });

  test('adds a note', async () => {
    renderFooter();

    await userEvent.click(screen.getByTestId('addNoteButton'));

    expect(onAddNote).toHaveBeenCalled();
  });

  test('disables the add note button while a note is being written', () => {
    renderFooter({ disableAddNoteButton: true });

    expect(screen.getByTestId('addNoteButton')).toBeDisabled();
  });

  test('does not let a leg that is not under way take notes, attachments or events', () => {
    renderFooter({ isLegActive: false });

    expect(screen.getByTestId('addNoteButton')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add an attachment' })).toBeDisabled();
    expect(screen.getByRole('button', { name: ADD_EVENT_BUTTON_LABEL })).toBeDisabled();
  });

  test('says why a leg that is not under way takes no notes, attachments or events', () => {
    renderFooter({ isLegActive: false });

    expect(screen.getByText('Only a patrol leg that is under way can take notes, attachments and events'))
      .toBeInTheDocument();
  });

  test('says nothing about the actions of a leg that is under way', () => {
    renderFooter();

    expect(screen.queryByText('Only a patrol leg that is under way can take notes, attachments and events'))
      .not.toBeInTheDocument();
  });

  test('still lets a leg that is not under way be edited and saved', () => {
    renderFooter({ disableSaveButton: false, isLegActive: false });

    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
  });

  test('disables the save button while there is nothing to save', () => {
    renderFooter();

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  test('saves the staged notes and attachments', async () => {
    renderFooter({ disableSaveButton: false });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalled();
  });

  test('marks the save button as busy and disables it while saving', () => {
    renderFooter({ disableSaveButton: false, isSaving: true });

    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toHaveAttribute('aria-busy', 'true');
    expect(saveButton).toBeDisabled();
  });

  test('hides the editing actions from a user without the update permission', () => {
    store.data.user.permissions = { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ] };

    renderFooter();

    expect(screen.queryByTestId('addNoteButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('addAttachmentButton')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: ADD_EVENT_BUTTON_LABEL })).toBeInTheDocument();
  });
});
