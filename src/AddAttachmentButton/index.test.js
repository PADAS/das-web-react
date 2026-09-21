import React from 'react';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen } from '../test-utils';
import AddAttachmentButton from './';

const dragLeaveOnto = (element, relatedTarget) => {
  const event = new MouseEvent('dragleave', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'relatedTarget', { value: relatedTarget });

  fireEvent(element, event);
};

describe('AddAttachmentButton', () => {
  const onAddAttachments = jest.fn();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderAddAttachmentButton = (props) => render(
    <AddAttachmentButton onAddAttachments={onAddAttachments} {...props} />
  );

  test('shows the add attachment button', () => {
    renderAddAttachmentButton();

    const addAttachmentButton = screen.getByRole('button', { name: 'Add an attachment' });

    expect(addAttachmentButton).toBeVisible();
    expect(addAttachmentButton).toHaveAttribute('title', 'Add an attachment');
    expect(addAttachmentButton).toHaveAttribute('type', 'button');
    expect(addAttachmentButton).toHaveTextContent('Attachment');
  });

  test('sets the accepted file types and allows selecting multiple files on the file input', () => {
    renderAddAttachmentButton();

    const fileInput = screen.getByTestId('addAttachmentButton');

    expect(fileInput).toHaveAttribute('multiple');
    expect(fileInput).toHaveAttribute('accept', expect.stringContaining('image/*'));
    expect(fileInput).toHaveAttribute('accept', expect.stringContaining('.pdf'));
  });

  test('opens the file picker when the user clicks the button', async () => {
    renderAddAttachmentButton();

    const fileInput = screen.getByTestId('addAttachmentButton');
    const clickSpy = jest.spyOn(fileInput, 'click');

    await userEvent.click(screen.getByRole('button', { name: 'Add an attachment' }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  test('triggers onAddAttachments if user adds a new attachment', async () => {
    renderAddAttachmentButton();

    expect(onAddAttachments).toHaveBeenCalledTimes(0);

    const fileInput = screen.getByTestId('addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    await userEvent.upload(fileInput, fakeFile);

    expect(onAddAttachments).toHaveBeenCalledTimes(1);
    expect(onAddAttachments.mock.calls[0][0][0].name).toBe('fake.txt');
  });

  test('resets the file input after adding an attachment, so the same file can be selected again', async () => {
    renderAddAttachmentButton();

    const fileInput = screen.getByTestId('addAttachmentButton');
    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    await userEvent.upload(fileInput, fakeFile);

    expect(fileInput.value).toBe('');
  });

  test('shows a dragging over style when a file is dragged over the button', async () => {
    renderAddAttachmentButton();

    const addAttachmentButton = screen.getByRole('button', { name: 'Add an attachment' });

    expect(addAttachmentButton).not.toHaveClass('draggingOver');

    fireEvent.dragOver(addAttachmentButton);

    expect(addAttachmentButton).toHaveClass('draggingOver');
  });

  test('clears the dragging over style when the drag leaves the button', async () => {
    renderAddAttachmentButton();

    const addAttachmentButton = screen.getByRole('button', { name: 'Add an attachment' });

    fireEvent.dragOver(addAttachmentButton);

    expect(addAttachmentButton).toHaveClass('draggingOver');

    fireEvent.dragLeave(addAttachmentButton);

    expect(addAttachmentButton).not.toHaveClass('draggingOver');
  });

  test('keeps the dragging over style when the drag moves onto the button icon or label', async () => {
    renderAddAttachmentButton();

    const addAttachmentButton = screen.getByRole('button', { name: 'Add an attachment' });

    fireEvent.dragOver(addAttachmentButton);

    expect(addAttachmentButton).toHaveClass('draggingOver');

    dragLeaveOnto(addAttachmentButton, addAttachmentButton.querySelector('svg'));

    expect(addAttachmentButton).toHaveClass('draggingOver');

    dragLeaveOnto(addAttachmentButton, screen.getByText('Attachment'));

    expect(addAttachmentButton).toHaveClass('draggingOver');
  });

  test('attaches dropped files and clears the dragging over style', async () => {
    renderAddAttachmentButton();

    expect(onAddAttachments).toHaveBeenCalledTimes(0);

    const addAttachmentButton = screen.getByRole('button', { name: 'Add an attachment' });
    fireEvent.dragOver(addAttachmentButton);

    const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
    const mockFileList = {
      '0': fakeFile,
      item: () => fakeFile,
      length: 1,
    };
    fireEvent.drop(addAttachmentButton, { dataTransfer: { files: mockFileList } });

    expect(onAddAttachments).toHaveBeenCalledTimes(1);
    expect(onAddAttachments.mock.calls[0][0][0].name).toBe('fake.txt');
    expect(addAttachmentButton).not.toHaveClass('draggingOver');
  });

  describe('when disabled', () => {
    test('marks the button as disabled', () => {
      renderAddAttachmentButton({ disabled: true });

      expect(screen.getByRole('button', { name: 'Add an attachment' })).toBeDisabled();
    });

    test('does not open the file picker', async () => {
      renderAddAttachmentButton({ disabled: true });

      const clickFileInput = jest.spyOn(screen.getByTestId('addAttachmentButton'), 'click');

      await userEvent.click(screen.getByRole('button', { name: 'Add an attachment' }));

      expect(clickFileInput).not.toHaveBeenCalled();
    });

    test('takes no dropped files and shows no dragging over style', () => {
      renderAddAttachmentButton({ disabled: true });

      const addAttachmentButton = screen.getByRole('button', { name: 'Add an attachment' });
      fireEvent.dragOver(addAttachmentButton);

      expect(addAttachmentButton).not.toHaveClass('draggingOver');

      const fakeFile = new File(['fake'], 'fake.txt', { type: 'text/plain' });
      fireEvent.drop(addAttachmentButton, {
        dataTransfer: { files: { '0': fakeFile, item: () => fakeFile, length: 1 } },
      });

      expect(onAddAttachments).not.toHaveBeenCalled();
    });
  });
});
