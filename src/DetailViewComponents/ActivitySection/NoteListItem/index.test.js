import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrackerContext } from '../../../utils/analytics';

import NoteListItem from '.';

describe('ActivitySection - Note', () => {
  const saveButtonText = 'Done';
  const initialProps  = {
    onCollapse: jest.fn(),
    onChange: jest.fn(),
    onDone: jest.fn(),
    onDelete: jest.fn(),
    onExpand: jest.fn(),
    onSave: jest.fn(),
    note: {}
  };

  let Wrapper, renderWithWrapper;

  const renderNoteListItem = (props, addNoteExpandedCard = true) => {
    const cardsExpanded = addNoteExpandedCard ? [props.note] : [];
    return renderWithWrapper(<NoteListItem
        {...initialProps}
        cardsExpanded={cardsExpanded}
        {...props}
    />);
  };

  beforeEach(() => {
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

    expect((await screen.findByTestId('activitySection-noteTitle-')).textContent).toBe('New note');
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

    expect((await screen.findByTestId('activitySection-dateTime-1234'))).toBeDefined();
  });

  test('does not show the date time if it is a new note', async () => {
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    expect((await screen.queryByTestId('activitySection-dateTime-note'))).toBeNull();
  });

  test('user can delete a new note', async () => {
    const { onDelete } = initialProps;
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    expect(onDelete).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByTestId('activitySection-deleteIcon-note');
    userEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('user can not delete an existing note', async () => {
    const note = { id: '1234', text: 'note', updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }] };
    renderNoteListItem({ ...initialProps, note });

    expect((await screen.queryByTestId('activitySection-deleteIcon-1234'))).toBeNull();
  });

  test('user can edit a note', async () => {
    const { onExpand } = initialProps;
    const note = { text: 'note', id: 'someID' };
    renderNoteListItem({ ...initialProps, note });

    expect(onExpand).toHaveBeenCalledTimes(0);
    expect((await screen.queryByText(saveButtonText))).toBeNull();
    expect((await screen.findByRole('textbox'))).toHaveProperty('readOnly', true);

    const editButton = await screen.findByTestId('activitySection-editIcon-someID');
    userEvent.click(editButton);

    expect(onExpand).toHaveBeenCalledTimes(1);
    expect((await screen.findByText(saveButtonText))).toBeDefined();
    expect((await screen.findByRole('textbox'))).toHaveProperty('readOnly', false);
  });

  test('user can open the note collapsible', async () => {
    const { onExpand } = initialProps;
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note }, false);

    expect(onExpand).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('activitySection-collapse-note'))).toHaveClass('collapse');

    const expandNoteButton = await screen.findByText('arrow-down-simple.svg');
    userEvent.click(expandNoteButton);

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  test('user can close the note collapsible', async () => {
    const { onCollapse } = initialProps;
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    expect(onCollapse).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('activitySection-collapse-note'))).toHaveClass('show');

    const colapseNoteButton = await screen.findByText('arrow-up-simple.svg');
    userEvent.click(colapseNoteButton);

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  test.skip('user can cancel the edit of a note', async () => {
    const note = { text: 'note', id: 'someID' };
    renderNoteListItem({ ...initialProps, note });

    const noteTextArea = await screen.findByRole('textbox');

    expect(noteTextArea).toHaveTextContent('note');

    const editButton = await screen.findByTestId('activitySection-editIcon-someID');
    userEvent.click(editButton);
    userEvent.type(noteTextArea, 'edition');

    expect(noteTextArea).toHaveTextContent('edition');

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(noteTextArea).toHaveTextContent('note');
    expect((await screen.queryByText(saveButtonText))).toBeNull();
  });

  test.skip('user can save edits to a new note', async () => {
    const { onSave } = initialProps;
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    expect(onSave).toHaveBeenCalledTimes(0);

    const noteTextArea = await screen.findByRole('textbox');

    expect(noteTextArea).toHaveTextContent('note');
    userEvent.type(noteTextArea, 'edition');

    expect(noteTextArea).toHaveTextContent('edition');

    const saveButton = await screen.findByText(saveButtonText);
    userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ text: 'noteedition' }));
    expect((await screen.queryByText(saveButtonText))).toBeNull();
  });

  test('user can not type an empty space at the beginning of a note', async () => {
    const { onSave } = initialProps;
    const note = { text: '' };
    renderNoteListItem({ ...initialProps, note });

    expect(onSave).toHaveBeenCalledTimes(0);

    const noteTextArea = await screen.findByRole('textbox');
    const editButton = await screen.findByTestId('activitySection-editIcon-');
    userEvent.click(editButton);
    userEvent.type(noteTextArea, ' ');

    expect(noteTextArea).toHaveTextContent('');
  });

  test.skip('empty spaces at the end of a note get trimmed before saving', async () => {
    const { onDone, onChange } = initialProps;
    const note = { text: 'note' };
    renderNoteListItem({ ...initialProps, note });

    expect(onChange).toHaveBeenCalledTimes(0);

    const noteTextArea = await screen.findByRole('textbox');
    userEvent.type(noteTextArea, 'edition     ');

    const saveButton = await screen.findByText(saveButtonText);
    userEvent.click(saveButton);

    /*expect(onChange).toHaveBeenCalledTimes(1);*/
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ text: 'noteedition' }));
  });

  test('edit button is disabled while editing a new empty note', async () => {
    const note = { text: '' };
    renderNoteListItem({ ...initialProps, note });

    expect((await screen.findByTestId('activitySection-editIcon-'))).toHaveClass('disabled');
  });
});
