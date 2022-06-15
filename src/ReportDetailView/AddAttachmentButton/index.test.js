import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddAttachmentButton from './';

describe('ReportDetailView - AddAttachmentButton', () => {
  const onAddAttachments = jest.fn();
  beforeEach(() => {
    render(<AddAttachmentButton onAddAttachments={onAddAttachments} />);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers onAddAttachments if user adds a new attachment', async () => {
    expect(onAddAttachments).toHaveBeenCalledTimes(0);

    const addAttachmentButton = await screen.findByTestId('reportDetailView-addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);

    expect(onAddAttachments).toHaveBeenCalledTimes(1);
    expect(onAddAttachments.mock.calls[0][0][0].name).toBe('fake.txt');
  });

  test('shows style feedback when dragging over attachments button', async () => {
    const addAttachmentVisualButton = await screen.findByRole('button');

    expect(addAttachmentVisualButton).not.toHaveClass('draggingOver');

    fireEvent.dragOver(addAttachmentVisualButton);

    expect(addAttachmentVisualButton).toHaveClass('draggingOver');

    fireEvent.dragLeave(addAttachmentVisualButton);

    expect(addAttachmentVisualButton).not.toHaveClass('draggingOver');
  });

  test('attaches dropped files', async () => {
    expect(onAddAttachments).toHaveBeenCalledTimes(0);

    const addAttachmentVisualButton = await screen.findByRole('button');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    const mockFileList = {
      '0': fakeFile,
      item: () => fakeFile,
      length: 1,
    };
    fireEvent.drop(addAttachmentVisualButton, { dataTransfer: { files: mockFileList } });

    expect(onAddAttachments).toHaveBeenCalledTimes(1);
    expect(onAddAttachments.mock.calls[0][0][0].name).toBe('fake.txt');
  });
});
