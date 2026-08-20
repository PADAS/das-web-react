import React from 'react';
import userEvent from '@testing-library/user-event';

import { TrackerContext } from '../../../utils/analytics';
import { render, screen, waitFor } from '../../../test-utils';

import NoteListItem from '.';

describe('ActivitySection - Note', () => {
  const saveButtonText = 'Done';
  const initialProps  = {
    onCollapse: jest.fn(),
    onChange: jest.fn(),
    onDone: jest.fn(),
    onDelete: jest.fn(),
    onCancel: jest.fn(),
    onExpand: jest.fn(),
    note: {}
  };

  let Wrapper, renderWithWrapper;

  const renderNoteListItem = (props, isOpen = true) => renderWithWrapper(<NoteListItem
      {...initialProps}
      isOpen={isOpen}
      {...props}
  />);

  beforeEach(() => {
    jest.clearAllMocks();

    Wrapper = ({ children }) => /* eslint-disable-line react/display-name */
      <TrackerContext.Provider value={{ track: jest.fn() }}>
        {children}
      </TrackerContext.Provider>;
    renderWithWrapper = Component => render(Component, { wrapper: Wrapper });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sets the name New note to a new added note', async () => {
    const note = { text: '' };
    renderNoteListItem({ ...initialProps, note });

    expect((await screen.findByTestId('activitySection-noteTitle-')).textContent).toBe('New note: ');
  });

  test('adds the text New note: before the note text if the note is not part of the patrol yet', async () => {
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    expect((await screen.findByTestId('activitySection-noteTitle-note')).textContent)
      .toBe('New note: note');
  });

  test('does not add the text New note: if the note is saved in the patrol already', async () => {
    const note = { id: '1234', text: 'note', updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }] };
    renderNoteListItem({ ...initialProps, note });

    expect((await screen.findByTestId('activitySection-noteTitle-1234')).textContent).toBe('note');
  });

  test('shows the date time of the last update of the note if it is saved in the patrol already', async () => {
    const note = { id: '1234', text: 'note', updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }] };
    renderNoteListItem({ ...initialProps, note });

    expect((await screen.findByTestId('activitySection-dateTime-1234')))
      .toHaveAttribute('dateTime', new Date(note.updates[0].time).toISOString());
  });

  test('does not show the date time if it is a new note', async () => {
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    expect((screen.queryByTestId('activitySection-dateTime-note'))).toBeNull();
  });

  test('renders a note that has no text yet', async () => {
    const note = { id: '1234' };
    renderNoteListItem({ ...initialProps, note });

    expect((await screen.findByTestId('activitySection-noteTextArea-1234'))).toHaveValue('');
  });

  test('does not show the date time if the note has no updates yet', async () => {
    const note = { id: '1234', text: 'note', updates: [] };
    renderNoteListItem({ ...initialProps, note });

    expect((screen.queryByTestId('activitySection-dateTime-1234'))).toBeNull();
  });

  test('user can delete a new note', async () => {
    const { onDelete } = initialProps;
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    expect(onDelete).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByTestId('activitySection-deleteIcon-note');
    await userEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(note);
  });

  test('does not toggle the card when deleting a new note', async () => {
    const { onCollapse, onDelete } = initialProps;
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    const deleteButton = await screen.findByTestId('activitySection-deleteIcon-note');
    await userEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onCollapse).toHaveBeenCalledTimes(0);
  });

  test('does not offer to delete a new note when there is no delete handler', async () => {
    const note = { text: 'note', tmpId: 'tmpId' };
    renderNoteListItem({ ...initialProps, note, onDelete: undefined });

    expect((screen.queryByRole('button', { name: 'Delete note' }))).toBeNull();
    expect((await screen.findByRole('button', { name: 'Collapse note' }))).not.toBeDisabled();
  });

  test('user can complete a note', async () => {
    const { onDone } = initialProps;
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    expect(onDone).toHaveBeenCalledTimes(0);

    const doneButton = await screen.findByTestId('activitySection-noteDone-note');
    await userEvent.click(doneButton);

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('user can not complete a note whose text is only whitespace', async () => {
    const note = { text: '   ' };
    renderNoteListItem({ ...initialProps, note });

    expect((await screen.findByRole('button', { name: saveButtonText }))).toBeDisabled();
  });

  test('user can not complete a note whose text did not change', async () => {
    const note = { id: '1234', originalText: 'note', text: 'note ' };
    renderNoteListItem({ ...initialProps, note });

    await userEvent.click(await screen.findByRole('button', { name: 'Edit note' }));

    expect((await screen.findByTestId('activitySection-noteDone-1234'))).toBeDisabled();
  });

  test('user can cancel a note', async () => {
    const { onCancel } = initialProps;
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    expect(onCancel).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByTestId('activitySection-noteCancel-note');
    await userEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('user deletes a new note that was never saved when cancelling it', async () => {
    const { onCancel, onDelete } = initialProps;
    const note = { text: 'note', tmpId: 'tmpId' };
    renderNoteListItem({ ...initialProps, note });

    const cancelButton = await screen.findByTestId('activitySection-noteCancel-note');
    await userEvent.click(cancelButton);

    expect(onDelete).toHaveBeenCalledWith(note);
    expect(onCancel).toHaveBeenCalledTimes(0);
  });

  test('user discards the edition of a note when collapsing it', async () => {
    const { onCancel } = initialProps;
    const note = { id: '1234', originalText: 'note', text: 'note edited' };
    const { rerender } = renderNoteListItem({ ...initialProps, note });

    await userEvent.click(await screen.findByRole('button', { name: 'Edit note' }));

    expect((await screen.findByRole('button', { name: saveButtonText }))).toBeDefined();

    rerender(<NoteListItem {...initialProps} isOpen={false} note={note} />);

    expect(onCancel).toHaveBeenCalledWith(note);
    expect((screen.queryByRole('button', { name: saveButtonText }))).toBeNull();
  });

  test('user keeps a note that was never saved when collapsing it', async () => {
    const { onCancel, onDelete } = initialProps;
    const note = { text: 'note', tmpId: 'tmpId' };
    const { rerender } = renderNoteListItem({ ...initialProps, note });

    rerender(<NoteListItem {...initialProps} isOpen={false} note={note} />);

    expect(onCancel).toHaveBeenCalledWith(note);
    expect(onDelete).toHaveBeenCalledTimes(0);
  });

  test('user can not collapse a note that was never saved', async () => {
    const { onCollapse } = initialProps;
    const note = { text: 'note', tmpId: 'tmpId' };
    renderNoteListItem({ ...initialProps, note });

    expect((await screen.findByRole('button', { name: 'Collapse note' }))).toBeDisabled();

    const noteTitle = await screen.findByTestId('activitySection-noteTitle-note');
    await userEvent.click(noteTitle);

    expect(onCollapse).toHaveBeenCalledTimes(0);
    expect(noteTitle.closest('.itemRow')).not.toHaveClass('collapseRow');
  });

  test('user can collapse a note that was never saved once it has been saved', async () => {
    const { onCollapse } = initialProps;
    const note = { originalText: 'note', text: 'note', tmpId: 'tmpId' };
    renderNoteListItem({ ...initialProps, note });

    const collapseNoteButton = await screen.findByRole('button', { name: 'Collapse note' });

    expect(collapseNoteButton).not.toBeDisabled();

    await userEvent.click(collapseNoteButton);

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  test('user can not delete an existing note', async () => {
    const note = { id: '1234', text: 'note', updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }] };
    renderNoteListItem({ ...initialProps, note });

    expect((screen.queryByTestId('activitySection-deleteIcon-1234'))).toBeNull();
  });

  test('user can edit a note', async () => {
    const { onCollapse, onExpand } = initialProps;
    const note = { text: 'note', id: 'someID' };
    renderNoteListItem({ ...initialProps, note });

    expect((screen.queryByText(saveButtonText))).toBeNull();
    expect((await screen.findByRole('textbox', { name: 'Note text' }))).toHaveProperty('readOnly', true);

    const editButton = await screen.findByRole('button', { name: 'Edit note' });
    await userEvent.click(editButton);

    expect(onCollapse).toHaveBeenCalledTimes(0);
    expect(onExpand).toHaveBeenCalledTimes(0);
    expect((await screen.findByText(saveButtonText))).toBeDefined();
    expect((await screen.findByRole('textbox', { name: 'Note text' }))).toHaveProperty('readOnly', false);
    expect(editButton).toBeDisabled();
  });

  test('user expands a collapsed note when editing it', async () => {
    const { onExpand } = initialProps;
    const note = { text: 'note', id: 'someID' };
    renderNoteListItem({ ...initialProps, note }, false);

    const editButton = await screen.findByRole('button', { name: 'Edit note' });
    await userEvent.click(editButton);

    expect(onExpand).toHaveBeenCalledTimes(1);
    expect(onExpand.mock.calls[0][0]).toBe(note);
  });

  test('puts the caret at the end of the note text once the card finishes expanding', async () => {
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    const noteTextArea = await screen.findByRole('textbox', { name: 'Note text' });

    await waitFor(() => expect(noteTextArea).toHaveFocus());
    expect(noteTextArea.selectionStart).toBe(note.text.length);
    expect(noteTextArea.selectionEnd).toBe(note.text.length);
  });

  test('does not focus a note that is not being edited', async () => {
    const focus = jest.spyOn(HTMLTextAreaElement.prototype, 'focus');
    const note = { id: '1234', text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(focus).toHaveBeenCalledTimes(0);
  });

  test('does not focus the note text after the card unmounts', async () => {
    const focus = jest.spyOn(HTMLTextAreaElement.prototype, 'focus');
    const note = { text: 'note' };
    const { unmount } = renderNoteListItem({ ...initialProps, note });

    unmount();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(focus).toHaveBeenCalledTimes(0);
  });

  test('renders the card collapsed by default', async () => {
    const note = { id: '1234', text: 'note' };
    renderNoteListItem({ ...initialProps, note, isOpen: undefined });

    expect((await screen.findByTestId('activitySection-collapse-1234'))).not.toHaveClass('show');
  });

  test('user can open the note collapsible', async () => {
    const { onExpand } = initialProps;
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note }, false);

    expect(onExpand).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('activitySection-collapse-note'))).toHaveClass('collapse');

    const expandNoteButton = await screen.findByRole('button', { name: 'Expand note' });

    expect(expandNoteButton).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(expandNoteButton);

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  test('user can close the note collapsible', async () => {
    const { onCollapse } = initialProps;
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    expect(onCollapse).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('activitySection-collapse-note'))).toHaveClass('show');

    const collapseNoteButton = await screen.findByRole('button', { name: 'Collapse note' });

    expect(collapseNoteButton).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(collapseNoteButton);

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  test('keeps the note text reachable while the card is open, but not while it is collapsed', async () => {
    const note = { id: '1234', text: 'note' };
    const { rerender } = renderNoteListItem({ ...initialProps, note });

    expect((await screen.findByTestId('activitySection-noteTextArea-1234')).parentElement)
      .not.toHaveAttribute('inert');

    rerender(<NoteListItem {...initialProps} isOpen={false} note={note} />);

    expect((await screen.findByTestId('activitySection-noteTextArea-1234')).parentElement)
      .toHaveAttribute('inert');
  });

  test('user types on the note text area', async () => {
    const { onChange } = initialProps;
    const note = { text: '' };
    renderNoteListItem({ ...initialProps, note });

    const noteTextArea = await screen.findByRole('textbox', { name: 'Note text' });
    await userEvent.type(noteTextArea, 'a');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBe(note);
  });

  test('edit button is disabled while editing a new empty note', async () => {
    const note = { text: '' };
    renderNoteListItem({ ...initialProps, note });

    expect((await screen.findByRole('button', { name: 'Edit note' }))).toBeDisabled();
  });
});
