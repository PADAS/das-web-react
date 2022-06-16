import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Note from './';

describe('ReportDetailView - ActivitySection - Note', () => {
  const setCardsExpanded = jest.fn(), setNotesToAdd = jest.fn(), setReportNotes = jest.fn();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('adds the text (New note) if the note is not part of the report yet', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      notesToAdd={[note]}
      setCardsExpanded={setCardsExpanded}
      setNotesToAdd={setNotesToAdd}
    />);

    expect((await screen.findByText('(New note) note'))).toBeDefined();
  });

  test('does not add the text (New note) if the note is saved in the report already', async () => {
    const note = { id: '1234', text: 'note', updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }] };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      reportNotes={[note]}
      setCardsExpanded={setCardsExpanded}
      setReportNotes={setReportNotes}
    />);

    expect((await screen.queryByText('(New note) note'))).toBeNull();
  });

  test('shows the date time of the last update of the note if it is saved in the report already', async () => {
    const note = { id: '1234', text: 'note', updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }] };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      reportNotes={[note]}
      setCardsExpanded={setCardsExpanded}
      setReportNotes={setReportNotes}
    />);

    expect((await screen.findByTestId('reportDetailView-activitySection-dateTime'))).toBeDefined();
  });

  test('does not show the date time if it is a new note', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      notesToAdd={[note]}
      setCardsExpanded={setCardsExpanded}
      setNotesToAdd={setNotesToAdd}
    />);

    expect((await screen.queryByTestId('reportDetailView-activitySection-dateTime'))).toBeNull();
  });

  test('user can delete a new note', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      notesToAdd={[note]}
      setCardsExpanded={setCardsExpanded}
      setNotesToAdd={setNotesToAdd}
    />);

    expect(setNotesToAdd).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByTestId('reportDetailView-activitySection-deleteIcon');
    userEvent.click(deleteButton);

    expect(setNotesToAdd).toHaveBeenCalledTimes(1);
    expect(setNotesToAdd).toHaveBeenCalledWith([]);
  });

  test('user can not delete an existing note', async () => {
    const note = { id: '1234', text: 'note', updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }] };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      reportNotes={[note]}
      setCardsExpanded={setCardsExpanded}
      setReportNotes={setReportNotes}
    />);

    expect((await screen.queryByTestId('reportDetailView-activitySection-deleteIcon'))).toBeNull();
  });

  test('user can edit a note', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[]}
      note={note}
      notesToAdd={[note]}
      setCardsExpanded={setCardsExpanded}
      setNotesToAdd={setNotesToAdd}
    />);

    expect(setCardsExpanded).toHaveBeenCalledTimes(0);
    expect((await screen.queryAllByRole('button'))).toHaveLength(0);
    expect((await screen.findByRole('textbox'))).toHaveProperty('readOnly', true);

    const editButton = await screen.findByTestId('reportDetailView-activitySection-editIcon');
    userEvent.click(editButton);

    expect(setCardsExpanded).toHaveBeenCalledTimes(1);
    expect(setCardsExpanded).toHaveBeenCalledWith([note]);
    expect((await screen.findAllByRole('button'))).toHaveLength(2);
    expect((await screen.findByRole('textbox'))).toHaveProperty('readOnly', false);
  });

  test('user can open the note collapsible', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[]}
      note={note}
      notesToAdd={[note]}
      setCardsExpanded={setCardsExpanded}
      setNotesToAdd={setNotesToAdd}
    />);

    expect(setCardsExpanded).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('reportDetailView-activitySection-collapse'))).toHaveClass('collapse');

    const expandNoteButton = await screen.findByText('arrow-down-small.svg');
    userEvent.click(expandNoteButton);

    expect(setCardsExpanded).toHaveBeenCalledTimes(1);
    expect(setCardsExpanded).toHaveBeenCalledWith([note]);
  });

  test('user can close the note collapsible', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      notesToAdd={[note]}
      setCardsExpanded={setCardsExpanded}
      setNotesToAdd={setNotesToAdd}
    />);

    expect(setCardsExpanded).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('reportDetailView-activitySection-collapse'))).toHaveClass('show');

    const colapseNoteButton = await screen.findByText('arrow-up-small.svg');
    userEvent.click(colapseNoteButton);

    expect(setCardsExpanded).toHaveBeenCalledTimes(1);
    expect(setCardsExpanded).toHaveBeenCalledWith([]);
  });

  test('user can cancel the edition of a note', async () => {
    const note = { text: 'note' };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      notesToAdd={[note]}
      setCardsExpanded={setCardsExpanded}
      setNotesToAdd={setNotesToAdd}
    />);

    const noteTextArea = await screen.findByRole('textbox');

    expect(noteTextArea).toHaveTextContent('note');

    const editButton = await screen.findByTestId('reportDetailView-activitySection-editIcon');
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
      notesToAdd={[note]}
      setCardsExpanded={setCardsExpanded}
      setNotesToAdd={setNotesToAdd}
    />);

    expect(setNotesToAdd).toHaveBeenCalledTimes(0);
    expect(setCardsExpanded).toHaveBeenCalledTimes(0);

    const noteTextArea = await screen.findByRole('textbox');

    expect(noteTextArea).toHaveTextContent('note');

    const editButton = await screen.findByTestId('reportDetailView-activitySection-editIcon');
    userEvent.click(editButton);
    userEvent.type(noteTextArea, 'edition');

    expect(noteTextArea).toHaveTextContent('edition');

    const cancelButton = (await screen.findAllByRole('button'))[1];
    userEvent.click(cancelButton);
    const noteToSave = { text: 'noteedition' };

    expect(setNotesToAdd).toHaveBeenCalledTimes(1);
    expect(setNotesToAdd).toHaveBeenCalledWith([noteToSave]);
    expect(setCardsExpanded).toHaveBeenCalledTimes(1);
    expect(setCardsExpanded).toHaveBeenCalledWith([noteToSave]);
    expect((await screen.queryAllByRole('button'))).toHaveLength(0);
  });

  test('user can save the edition of an existing note', async () => {
    const note = { id: '1234', text: 'note', updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }] };
    render(<Note
      cardsExpanded={[note]}
      note={note}
      reportNotes={[note]}
      setCardsExpanded={setCardsExpanded}
      setReportNotes={setReportNotes}
    />);

    expect(setReportNotes).toHaveBeenCalledTimes(0);
    expect(setCardsExpanded).toHaveBeenCalledTimes(0);

    const noteTextArea = await screen.findByRole('textbox');

    expect(noteTextArea).toHaveTextContent('note');

    const editButton = await screen.findByTestId('reportDetailView-activitySection-editIcon');
    userEvent.click(editButton);
    userEvent.type(noteTextArea, 'edition');

    expect(noteTextArea).toHaveTextContent('edition');

    const cancelButton = (await screen.findAllByRole('button'))[1];
    userEvent.click(cancelButton);
    const noteToSave = { id: '1234', text: 'noteedition', updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }] };

    expect(setReportNotes).toHaveBeenCalledTimes(1);
    expect(setReportNotes).toHaveBeenCalledWith([noteToSave]);
    expect(setCardsExpanded).toHaveBeenCalledTimes(1);
    expect(setCardsExpanded).toHaveBeenCalledWith([noteToSave]);
    expect((await screen.queryAllByRole('button'))).toHaveLength(0);
  });
});
