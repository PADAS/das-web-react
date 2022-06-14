import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddAttachmentButton from './';

describe('ReportDetailView - AddAttachmentButton', () => {
  const setAttachmentsToAdd = jest.fn(), track = jest.fn();
  beforeEach(() => {
    render(<AddAttachmentButton
      attachmentsToAdd={[]}
      reportAttachments={[]}
      reportTracker={{ track }}
      setAttachmentsToAdd={setAttachmentsToAdd}
    />);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers setAttachmentsToAdd if user adds a new attachment', async () => {
    expect(setAttachmentsToAdd).toHaveBeenCalledTimes(0);

    const addAttachmentButton = await screen.findByTestId('reportDetailView-addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);

    expect(setAttachmentsToAdd).toHaveBeenCalledTimes(1);
    expect(setAttachmentsToAdd.mock.calls[0][0][0].file.name).toBe('fake.txt');
  });

  test('omits duplicated files', async () => {
    expect(setAttachmentsToAdd).toHaveBeenCalledTimes(0);

    const addAttachmentButton = await screen.findByTestId('reportDetailView-addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFile);

    expect(setAttachmentsToAdd).toHaveBeenCalledTimes(1);
    expect(setAttachmentsToAdd.mock.calls[0][0]).toHaveLength(1);

    const fakeFileAgain = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    userEvent.upload(addAttachmentButton, fakeFileAgain);

    expect(setAttachmentsToAdd).toHaveBeenCalledTimes(2);
    expect(setAttachmentsToAdd.mock.calls[1][0]).toHaveLength(1);
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
    expect(setAttachmentsToAdd).toHaveBeenCalledTimes(0);

    const addAttachmentVisualButton = await screen.findByRole('button');
    const mockFileList = {
      item: () => new File(['fake'], 'fake.txt', { type: 'text/plain' }),
      length: 1,
    };
    fireEvent.drop(addAttachmentVisualButton, { dataTransfer: { files: mockFileList } });

    expect(setAttachmentsToAdd).toHaveBeenCalledTimes(1);
    expect(setAttachmentsToAdd.mock.calls[0][0][0].file.name).toBe('fake.txt');
  });
});
