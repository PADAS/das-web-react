import React from 'react';
import userEvent from '@testing-library/user-event';

import AddNoteButton from './';
import { render, screen } from '../test-utils';

describe('ReportManager - AddNoteButton', () => {
  const onAddNote = jest.fn();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers onAddNote if user adds a new note', async () => {
    render(<AddNoteButton onAddNote={onAddNote} />);

    expect(onAddNote).toHaveBeenCalledTimes(0);

    const addNoteButton = await screen.findByTestId('addNoteButton');
    userEvent.click(addNoteButton);

    expect(onAddNote).toHaveBeenCalledTimes(1);
  });
});
