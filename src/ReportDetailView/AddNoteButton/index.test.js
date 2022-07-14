import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddNoteButton from './';

describe('ReportDetailView - AddNoteButton', () => {
  const onAddNote = jest.fn();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers onAddNote if user adds a new note', async () => {
    render(<AddNoteButton onAddNote={onAddNote} />);

    expect(onAddNote).toHaveBeenCalledTimes(0);

    const addNoteButton = await screen.findByTestId('reportDetailView-addNoteButton');
    userEvent.click(addNoteButton);

    expect(onAddNote).toHaveBeenCalledTimes(1);
  });
});
