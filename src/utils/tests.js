import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

export const assertNoteEdition = async (updatedText, noteId) => {
  const editNoteIcon = await screen.findByTestId(`activitySection-editIcon-${noteId}`);
  userEvent.click(editNoteIcon);
  const noteTextArea = await screen.findByTestId(`activitySection-noteTextArea-${noteId}`);
  userEvent.type(noteTextArea, updatedText);
  const doneNoteButton = await screen.findByTestId(`activitySection-noteDone-${noteId}`);
  userEvent.click(doneNoteButton);
  const textArea = await screen.findByTestId(`activitySection-noteTextArea-${noteId}`);
  return { textArea, doneNoteButton, };
};
