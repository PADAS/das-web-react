import React from 'react';
import userEvent from '@testing-library/user-event';

import AddItemButton from '../../../../AddItemButton';
import { render, screen } from '../../../../test-utils';

import Footer from './';

jest.mock('../../../../AddItemButton', () => jest.fn());

describe('SideBar - PatrolsManager - PatrolOverview - Footer', () => {
  const addEventFormProps = { isPatrolReport: true };

  let addItemButtonMock;
  let onAddAttachments;
  let onAddNote;
  let onSave;

  beforeEach(() => {
    jest.clearAllMocks();

    addItemButtonMock = jest.fn(() => <button data-testid="addEventButton" type="button" />);
    AddItemButton.mockImplementation(addItemButtonMock);

    onAddAttachments = jest.fn();
    onAddNote = jest.fn();
    onSave = jest.fn();
  });

  const renderFooter = (props) => render(
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

  test('shows the update status options when the dropdown is opened', async () => {
    renderFooter();

    expect(screen.queryByRole('button', { name: 'Pause Patrol' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Update Status' }));

    expect(screen.getByRole('button', { name: 'Pause Patrol' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel Patrol' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End Patrol' })).toBeInTheDocument();
  });

  test('shows the end patrol button instead of the update status dropdown for a mobile patrol', () => {
    renderFooter({ isMobilePatrol: true });

    expect(screen.queryByRole('button', { name: 'Update Status' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End Patrol' })).toBeInTheDocument();
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

    const saveButton = screen.getByRole('button', { name: 'Loading' });

    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveAttribute('aria-busy', 'true');
    // The label stays rendered underneath the loader to hold the button's width.
    expect(saveButton).toHaveTextContent('Save');
  });
});
