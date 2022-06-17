import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Note from './';

describe('ReportDetailView - ActivitySection - Note', () => {
  const onCollapse = jest.fn(), onDelete = jest.fn(), onExpand = jest.fn(), onSave = jest.fn();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sets the name New note to a new added note', async () => {
    const note = { text: '' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onDelete={onDelete}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect((await screen.findByTestId('reportDetailView-activitySection-noteTitle-')).textContent).toBe('New note');
  });

  test('adds the text New note: before the note text if the note is not part of the report yet', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onDelete={onDelete}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect((await screen.findByTestId('reportDetailView-activitySection-noteTitle-note')).textContent)
      .toBe('New note: note');
  });

  test('does not add the text New note: if the note is saved in the report already', async () => {
    const note = { id: '1234', text: 'note', updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }] };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect((await screen.findByTestId('reportDetailView-activitySection-noteTitle-1234')).textContent).toBe('note');
  });

  test('shows the date time of the last update of the note if it is saved in the report already', async () => {
    const note = { id: '1234', text: 'note', updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }] };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect((await screen.findByTestId('reportDetailView-activitySection-dateTime-1234'))).toBeDefined();
  });

  test('does not show the date time if it is a new note', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onDelete={onDelete}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect((await screen.queryByTestId('reportDetailView-activitySection-dateTime-note'))).toBeNull();
  });

  test('user can delete a new note', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onDelete={onDelete}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect(onDelete).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByTestId('reportDetailView-activitySection-deleteIcon-note');
    userEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('user can not delete an existing note', async () => {
    const note = { id: '1234', text: 'note', updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }] };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect((await screen.queryByTestId('reportDetailView-activitySection-deleteIcon-1234'))).toBeNull();
  });

  test('user can edit a note', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[]}
      note={note}
      onCollapse={onCollapse}
      onDelete={onDelete}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect(onExpand).toHaveBeenCalledTimes(0);
    expect((await screen.queryAllByRole('button'))).toHaveLength(0);
    expect((await screen.findByRole('textbox'))).toHaveProperty('readOnly', true);

    const editButton = await screen.findByTestId('reportDetailView-activitySection-editIcon-note');
    userEvent.click(editButton);

    expect(onExpand).toHaveBeenCalledTimes(1);
    expect((await screen.findAllByRole('button'))).toHaveLength(2);
    expect((await screen.findByRole('textbox'))).toHaveProperty('readOnly', false);
  });

  test('user can open the note collapsible', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[]}
      note={note}
      onCollapse={onCollapse}
      onDelete={onDelete}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect(onExpand).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('reportDetailView-activitySection-collapse-note'))).toHaveClass('collapse');

    const expandNoteButton = await screen.findByText('arrow-down-small.svg');
    userEvent.click(expandNoteButton);

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  test('user can close the note collapsible', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onDelete={onDelete}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect(onCollapse).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('reportDetailView-activitySection-collapse-note'))).toHaveClass('show');

    const colapseNoteButton = await screen.findByText('arrow-up-small.svg');
    userEvent.click(colapseNoteButton);

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  test('user can cancel the edition of a note', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onDelete={onDelete}
      onExpand={onExpand}
      onSave={onSave}
    />);

    const noteTextArea = await screen.findByRole('textbox');

    expect(noteTextArea).toHaveTextContent('note');

    const editButton = await screen.findByTestId('reportDetailView-activitySection-editIcon-note');
    userEvent.click(editButton);
    userEvent.type(noteTextArea, 'edition');

    expect(noteTextArea).toHaveTextContent('edition');

    const cancelButton = (await screen.findAllByRole('button'))[0];
    userEvent.click(cancelButton);

    expect(noteTextArea).toHaveTextContent('note');
    expect((await screen.queryAllByRole('button'))).toHaveLength(0);
  });

  test('user can save the edition of a new note', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onDelete={onDelete}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect(onSave).toHaveBeenCalledTimes(0);

    const noteTextArea = await screen.findByRole('textbox');

    expect(noteTextArea).toHaveTextContent('note');

    const editButton = await screen.findByTestId('reportDetailView-activitySection-editIcon-note');
    userEvent.click(editButton);
    userEvent.type(noteTextArea, 'edition');

    expect(noteTextArea).toHaveTextContent('edition');

    const saveButton = (await screen.findAllByRole('button'))[1];
    userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('noteedition');
    expect((await screen.queryAllByRole('button'))).toHaveLength(0);
  });

  test('user can not type an empty space at the beginning of a note', async () => {
    const note = { text: '' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onDelete={onDelete}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect(onSave).toHaveBeenCalledTimes(0);

    const noteTextArea = await screen.findByRole('textbox');
    const editButton = await screen.findByTestId('reportDetailView-activitySection-editIcon-');
    userEvent.click(editButton);
    userEvent.type(noteTextArea, ' ');

    expect(noteTextArea).toHaveTextContent('');
  });

  test('empty spaces at the end of a note get trimmed before saving', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onDelete={onDelete}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect(onSave).toHaveBeenCalledTimes(0);

    const noteTextArea = await screen.findByRole('textbox');
    const editButton = await screen.findByTestId('reportDetailView-activitySection-editIcon-note');
    userEvent.click(editButton);
    userEvent.type(noteTextArea, 'edition     ');
    const saveButton = (await screen.findAllByRole('button'))[1];
    userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('noteedition');
  });

  test('cancel and edition buttons are disabled while editing a new empty note', async () => {
    const note = { text: '' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      onCollapse={onCollapse}
      onDelete={onDelete}
      onExpand={onExpand}
      onSave={onSave}
    />);

    expect((await screen.findByTestId('reportDetailView-activitySection-editIcon-'))).toHaveClass('disabled');
    expect((await screen.findAllByRole('button'))[0]).toHaveAttribute('disabled');
  });
});
