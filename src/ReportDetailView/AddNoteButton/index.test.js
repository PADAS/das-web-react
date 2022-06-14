import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddNoteButton from './';

describe('ReportDetailView - AddNoteButton', () => {
  const setNotesToAdd = jest.fn(), track = jest.fn();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers setNotesToAdd if user adds a new note', async () => {
    render(<AddNoteButton notesToAdd={[]} reportTracker={{ track }} setNotesToAdd={setNotesToAdd} />);

    expect(setNotesToAdd).toHaveBeenCalledTimes(0);

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton');
    userEvent.click(addNoteButton);

    expect(setNotesToAdd).toHaveBeenCalledTimes(1);
    expect(setNotesToAdd.mock.calls[0][0][0].text).toBe('');
  });

  test('does not let the user create a new note if there is already one that has not been saved', async () => {
    window.alert = jest.fn();
    render(<AddNoteButton notesToAdd={[{ text: '' }]} reportTracker={{ track }} setNotesToAdd={setNotesToAdd} />);

    expect(setNotesToAdd).toHaveBeenCalledTimes(0);
    expect(window.alert).toHaveBeenCalledTimes(0);

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton');
    userEvent.click(addNoteButton);

    expect(setNotesToAdd).toHaveBeenCalledTimes(0);
    expect(window.alert).toHaveBeenCalledTimes(1);
  });
});
