import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import AddItemButton from '../../../../AddItemButton';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { PERMISSION_KEYS, PERMISSIONS } from '../../../../constants';
import { render, screen } from '../../../../test-utils';

import Footer from './';

jest.mock('../../../../AddItemButton', () => jest.fn());

describe('SideBar - PatrolsManager - PatrolOverview - Footer', () => {
  const addEventFormProps = { isPatrolReport: true };

  let addItemButtonMock;
  let onAddAttachments;
  let onAddNote;
  let onSave;
  let store;

  beforeEach(() => {
    jest.clearAllMocks();

    addItemButtonMock = jest.fn(() => <button data-testid="addEventButton" type="button" />);
    AddItemButton.mockImplementation(addItemButtonMock);

    onAddAttachments = jest.fn();
    onAddNote = jest.fn();
    onSave = jest.fn();

    store = {
      data: { user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ, PERMISSIONS.UPDATE] } } },
      view: {},
    };
  });

  const renderFooter = (props) => render(
    <Provider store={mockStore(store)}>
      <Footer
        addEventFormProps={addEventFormProps}
        disableAddNoteButton={false}
        disableSaveButton={false}
        isSaving={false}
        onAddAttachments={onAddAttachments}
        onAddNote={onAddNote}
        onSave={onSave}
        {...props}
      />
    </Provider>
  );

  test('triggers onAddNote when the add note button is clicked', async () => {
    renderFooter();

    await userEvent.click(screen.getByTestId('addNoteButton'));

    expect(onAddNote).toHaveBeenCalledTimes(1);
  });

  test('disables the add note button when disableAddNoteButton is true', () => {
    renderFooter({ disableAddNoteButton: true });

    expect(screen.getByTestId('addNoteButton')).toBeDisabled();
  });

  test('enables the add note button when disableAddNoteButton is false', () => {
    renderFooter({ disableAddNoteButton: false });

    expect(screen.getByTestId('addNoteButton')).toBeEnabled();
  });

  test('triggers onAddAttachments when a file is uploaded', async () => {
    renderFooter();

    const fakeFile = new File(['file contents'], 'file.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByTestId('addAttachmentButton'), fakeFile);

    expect(onAddAttachments).toHaveBeenCalledTimes(1);
  });

  test('wires the add event button with the provided form props', () => {
    renderFooter();

    const [props] = addItemButtonMock.mock.calls.at(-1);

    expect(props.formProps).toBe(addEventFormProps);
    expect(props.hideAddPatrolTab).toBe(true);
    expect(props['aria-label']).toBe('Add Event');
    expect(props.title).toBe('Add Event');
    expect(props.label).toBe('Event');
    expect(props.analyticsMetadata).toEqual({ category: 'Patrol Overview', location: 'Patrol Overview' });
  });

  test('shows the save button enabled and not busy', () => {
    renderFooter();

    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toBeEnabled();
    expect(saveButton).toHaveAttribute('aria-busy', 'false');
  });

  test('triggers onSave when the save button is clicked', async () => {
    renderFooter();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test('disables the save button when there is nothing to save', () => {
    renderFooter({ disableSaveButton: true });

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  test('shows the save button busy and disabled while saving', () => {
    renderFooter({ isSaving: true });

    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveAttribute('aria-busy', 'true');
    // The label stays rendered underneath the loader to hold the button's width.
    expect(saveButton).toHaveTextContent('Save');
  });

  describe('a user who may not update patrols', () => {
    beforeEach(() => {
      store.data.user.permissions[PERMISSION_KEYS.PATROLS] = [PERMISSIONS.READ];
    });

    test('does not get the save button', () => {
      renderFooter();

      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    });

    test('does not get the add note button', () => {
      renderFooter();

      expect(screen.queryByTestId('addNoteButton')).not.toBeInTheDocument();
    });

    test('does not get the add attachment button', () => {
      renderFooter();

      expect(screen.queryByTestId('addAttachmentButton')).not.toBeInTheDocument();
    });

    test('still gets the add event button', () => {
      renderFooter();

      expect(screen.getByTestId('addEventButton')).toBeVisible();
    });
  });
});
