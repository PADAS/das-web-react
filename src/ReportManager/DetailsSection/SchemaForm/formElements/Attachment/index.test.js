import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen, waitFor } from '../../../../../test-utils';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { uploadFile } from '../../../../../ducks/user-content';
import { showToast } from '../../../../../utils/toast';

import Attachment from './';

jest.mock('../../../../../ducks/user-content', () => ({
  uploadFile: jest.fn(),
}));

jest.mock('../../../../../utils/toast', () => ({
  showToast: jest.fn(),
}));

describe('ReportManager - DetailsSection - SchemaForm - formElements - Attachment', () => {
  const onFieldChange = jest.fn();

  let details, store;
  beforeEach(() => {
    details = {
      allowableFileTypes: [],
      description: 'Attachment 1 Description',
      isRequired: false,
      label: 'Attachment 1 Label',
      maxItems: null,
      value: 'attachment-1',
    };

    store = mockStore({ data: { userContent: {} } });

    uploadFile.mockImplementation(() => async () => 'test-upload-id');
    jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
    jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  const renderAttachmentField = (props, overrideStore) => render(
    <Provider store={overrideStore ?? store}>
      <Attachment
        details={details}
        error={undefined}
        id="attachment-1"
        onFieldChange={onFieldChange}
        value={[]}
        {...props}
      />
    </Provider>
  );

  const getFileInput = () => screen.getByTestId('schema-form-attachment-field-attachment-1-file-input');
  const getDropzone = () => screen.getByTestId('schema-form-attachment-field-attachment-1-dropzone');

  test('shows the label as the accessible name of the field group', () => {
    renderAttachmentField();

    expect(screen.getByRole('group', { name: 'Attachment 1 Label' })).toBeInTheDocument();
    expect(screen.getByText('Attachment 1 Label')).toBeVisible();
  });

  test('shows a required marker when the field is required', () => {
    details.isRequired = true;
    renderAttachmentField();

    expect(screen.getByText('(required)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose File' })).toHaveAttribute('aria-required', 'true');
  });

  test('does not show an error state in the label when there are no errors', () => {
    renderAttachmentField();

    expect(screen.getByText('Attachment 1 Label')).not.toHaveClass('error');
  });

  test('shows an error state in the label when there are errors', () => {
    renderAttachmentField({ error: { message: 'Error message' } });

    expect(screen.getByText('Attachment 1 Label')).toHaveClass('error');
  });

  test('shows the description as the accessible description of the field', () => {
    renderAttachmentField();

    expect(screen.getByRole('group', { name: 'Attachment 1 Label' })).toHaveAccessibleDescription('Attachment 1 Description');
    expect(screen.getByText('Attachment 1 Description')).not.toHaveClass('error');
  });

  test('does not expose an accessible description when the description is empty', () => {
    details.description = '';
    renderAttachmentField();

    expect(screen.getByRole('group', { name: 'Attachment 1 Label' })).not.toHaveAccessibleDescription();
  });

  test('shows the error message as the accessible description when there are errors', () => {
    renderAttachmentField({ error: { message: 'Error message' } });

    expect(screen.getByRole('group', { name: 'Attachment 1 Label' })).toHaveAccessibleDescription('Error message');
    expect(screen.getByText('Error message')).toHaveClass('error');
  });

  test('shows a valid state when there are no errors', () => {
    renderAttachmentField();

    const labelGroup = screen.getByRole('group', { name: 'Attachment 1 Label' });

    expect(labelGroup).toHaveAttribute('aria-invalid', 'false');
    expect(labelGroup).toHaveAttribute('tabindex', '-1');
    expect(labelGroup).not.toHaveAttribute('aria-errormessage');
    expect(labelGroup).not.toHaveAccessibleErrorMessage();
  });

  test('shows an invalid state when there are errors', () => {
    renderAttachmentField({ error: { message: 'Error message' } });

    const labelGroup = screen.getByRole('group', { name: 'Attachment 1 Label' });

    expect(labelGroup).toHaveAttribute('aria-invalid', 'true');
    expect(labelGroup).toHaveAttribute('aria-errormessage', 'attachment-1-description');
    expect(labelGroup).toHaveAccessibleErrorMessage('Error message');
  });

  test('has a polite live region for screen reader announcements', () => {
    renderAttachmentField();

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  test('shows the dropzone when there are no files', () => {
    renderAttachmentField();

    expect(screen.getByText('Drag and drop files here')).toBeVisible();
  });

  test('does not show the dropzone when there are files', () => {
    renderAttachmentField({ value: [{ uploadId: 'saved-1', name: 'file1.pdf' }] });

    expect(screen.queryByText('Drag and drop files here')).not.toBeInTheDocument();
  });

  test('shows the files from the value', () => {
    renderAttachmentField({ value: [
      { uploadId: 'saved-1', name: 'file1.pdf' },
      { uploadId: 'saved-2', name: 'file2.png' },
    ] });

    expect(screen.getByText('file1.pdf')).toBeVisible();
    expect(screen.getByText('file2.png')).toBeVisible();
  });

  test('shows a fallback name for saved attachments without a name', () => {
    renderAttachmentField({ value: [
      { uploadId: 'saved-1' },
      { uploadId: 'saved-2' },
    ] });

    expect(screen.getByText('Attachment 1')).toBeVisible();
    expect(screen.getByText('Attachment 2')).toBeVisible();
  });

  test('hides the choose file button and file input in read-only mode', () => {
    renderAttachmentField({ readOnly: true });

    expect(screen.queryByRole('button', { name: 'Choose File' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('schema-form-attachment-field-attachment-1-file-input')).not.toBeInTheDocument();
  });

  test('shows the choose file button with correct attributes', () => {
    renderAttachmentField();

    const chooseFileButton = screen.getByRole('button', { name: 'Choose File' });

    expect(chooseFileButton).toBeVisible();
    expect(chooseFileButton).toHaveAttribute('type', 'button');
    expect(chooseFileButton).toHaveAttribute('aria-required', 'false');
    expect(chooseFileButton).not.toBeDisabled();
  });

  test('hides the remove buttons in read-only mode', () => {
    renderAttachmentField({
      readOnly: true,
      value: [{ uploadId: 'saved-1', name: 'file1.pdf' }],
    });

    expect(screen.queryByRole('button', { name: 'Remove file1.pdf' })).not.toBeInTheDocument();
  });

  test('shows the remove buttons with correct attributes', () => {
    renderAttachmentField({ value: [{ uploadId: 'saved-1', name: 'file1.pdf' }] });

    const removeButton = screen.getByRole('button', { name: 'Remove file1.pdf' });

    expect(removeButton).toBeVisible();
    expect(removeButton).toHaveAttribute('type', 'button');
    expect(removeButton).toHaveAttribute('aria-label', 'Remove file1.pdf');
    expect(removeButton).toHaveAttribute('title', 'Remove file1.pdf');
  });

  test('disables the choose file button when the maximum number of files is reached', () => {
    details.maxItems = 2;
    renderAttachmentField({ value: [
      { uploadId: 'saved-1', name: 'file1.pdf' },
      { uploadId: 'saved-2', name: 'file2.pdf' },
    ] });

    expect(screen.getByRole('button', { name: 'Choose File' })).toBeDisabled();
  });

  test('does not disable the choose file button when the maximum is not reached', () => {
    details.maxItems = 3;
    renderAttachmentField({ value: [{ uploadId: 'saved-1', name: 'file1.pdf' }] });

    expect(screen.getByRole('button', { name: 'Choose File' })).toBeEnabled();
  });

  test('renders the file input with correct attributes', () => {
    renderAttachmentField();

    const fileInput = getFileInput();

    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('multiple');
    expect(fileInput).toHaveAttribute('tabindex', '-1');
    expect(fileInput).not.toHaveAttribute('accept');
  });

  test('sets the accept attribute on the file input based on the allowed file types', () => {
    details.allowableFileTypes = ['image'];
    renderAttachmentField();

    expect(getFileInput()).toHaveAttribute('accept', 'image/*');
  });

  test('shows the selected file in the list', async () => {
    renderAttachmentField();

    await userEvent.upload(getFileInput(), new File(['content'], 'test.pdf', { type: 'application/pdf' }));

    expect(screen.getByText('test.pdf')).toBeVisible();
  });

  test('dispatches uploadFile when a file is selected', async () => {
    renderAttachmentField();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await userEvent.upload(getFileInput(), file);

    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(uploadFile).toHaveBeenCalledWith(file, expect.any(AbortSignal));
  });

  test('announces the upload start to screen readers', async () => {
    renderAttachmentField();

    await userEvent.upload(getFileInput(), new File(['content'], 'test.pdf', { type: 'application/pdf' }));

    expect(screen.getByRole('status')).toHaveTextContent('Uploading test.pdf');
  });

  test('shows the upload progress when a file is uploading', async () => {
    const overrideStore = mockStore({
      data: { userContent: { 'test-upload-id': { status: 'in_progress', progress: 0.5 } } },
    });
    renderAttachmentField({}, overrideStore);

    await userEvent.upload(getFileInput(), new File(['content'], 'test.pdf', { type: 'application/pdf' }));

    await waitFor(() => {
      expect(screen.getByText('Uploading… 50%')).toBeVisible();
    });
  });

  test('shows an upload error status when a file upload has failed', async () => {
    const overrideStore = mockStore({
      data: { userContent: { 'test-upload-id': { status: 'failed', progress: 0 } } },
    });
    renderAttachmentField({}, overrideStore);

    await userEvent.upload(getFileInput(), new File(['content'], 'test.pdf', { type: 'application/pdf' }));

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeVisible();
    });
  });

  test('calls onFieldChange when an upload completes', async () => {
    const overrideStore = mockStore({
      data: { userContent: { 'test-upload-id': { status: 'complete', progress: 1 } } },
    });
    renderAttachmentField({}, overrideStore);

    await userEvent.upload(getFileInput(), new File(['content'], 'test.pdf', { type: 'application/pdf' }));

    await waitFor(() => {
      expect(onFieldChange).toHaveBeenCalledWith('attachment-1', [
        { name: 'test.pdf', uploadId: 'test-upload-id' },
      ]);
    });
  });

  test('shows a toast and removes the file when an upload fails unexpectedly', async () => {
    uploadFile.mockImplementation(() => async () => { throw new Error('Network error'); });
    renderAttachmentField();

    await userEvent.upload(getFileInput(), new File(['content'], 'test.pdf', { type: 'application/pdf' }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith({ message: 'test.pdf couldn\'t be uploaded' });
    });
    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
  });

  test('removes a saved attachment when the remove button is clicked', async () => {
    renderAttachmentField({ value: [
      { uploadId: 'saved-1', name: 'file1.pdf' },
      { uploadId: 'saved-2', name: 'file2.pdf' },
    ] });

    await userEvent.click(screen.getByRole('button', { name: 'Remove file1.pdf' }));

    expect(onFieldChange).toHaveBeenCalledWith('attachment-1', [
      { uploadId: 'saved-2', name: 'file2.pdf' },
    ]);
  });

  test('removes an in-progress upload when the remove button is clicked', async () => {
    renderAttachmentField();

    await userEvent.upload(getFileInput(), new File(['content'], 'test.pdf', { type: 'application/pdf' }));

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeVisible();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Remove test.pdf' }));

    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
  });

  test('shows a toast when a file with a disallowed type is added', () => {
    details.allowableFileTypes = ['image'];
    renderAttachmentField();

    fireEvent.drop(screen.getByTestId('schema-form-attachment-field-attachment-1'), {
      dataTransfer: { files: [new File(['content'], 'test.pdf', { type: 'application/pdf' })] },
    });

    expect(showToast).toHaveBeenCalledWith({
      message: 'test.pdf can\'t be added because its file type isn\'t allowed.',
    });
  });

  test('does not add a file with a disallowed type to the list', () => {
    details.allowableFileTypes = ['image'];
    renderAttachmentField();

    fireEvent.drop(screen.getByTestId('schema-form-attachment-field-attachment-1'), {
      dataTransfer: { files: [new File(['content'], 'test.pdf', { type: 'application/pdf' })] },
    });

    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
  });

  test('shows a toast when selecting files exceeds the maximum', async () => {
    details.maxItems = 1;
    renderAttachmentField();

    await userEvent.upload(getFileInput(), [
      new File(['content'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['content'], 'test2.pdf', { type: 'application/pdf' }),
    ]);

    expect(showToast).toHaveBeenCalledWith({ message: 'You can only add up to 1 file.' });
  });

  test('only uploads files up to the maximum allowed', async () => {
    details.maxItems = 1;
    renderAttachmentField();

    await userEvent.upload(getFileInput(), [
      new File(['content'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['content'], 'test2.pdf', { type: 'application/pdf' }),
    ]);

    await waitFor(() => {
      expect(screen.getByText('test1.pdf')).toBeVisible();
    });
    expect(screen.queryByText('test2.pdf')).not.toBeInTheDocument();
  });

  test('shows a toast when a file with a duplicate name is selected', async () => {
    renderAttachmentField({ value: [{ uploadId: 'saved-1', name: 'existing.pdf' }] });

    await userEvent.upload(
      getFileInput(),
      new File(['content'], 'existing.pdf', { type: 'application/pdf' })
    );

    expect(showToast).toHaveBeenCalled();
  });

  test('applies the dragging-over style when dragging a file over the component', () => {
    renderAttachmentField();

    fireEvent.dragEnter(screen.getByTestId('schema-form-attachment-field-attachment-1'));

    expect(getDropzone()).toHaveClass('draggingOver');
  });

  test('removes the dragging-over style when the drag leaves the component', () => {
    renderAttachmentField();

    const group = screen.getByTestId('schema-form-attachment-field-attachment-1');
    fireEvent.dragEnter(group);
    fireEvent.dragLeave(group, { relatedTarget: document.body });

    expect(getDropzone()).not.toHaveClass('draggingOver');
  });

  test('adds files when they are dropped on the component', async () => {
    renderAttachmentField();

    fireEvent.drop(screen.getByTestId('schema-form-attachment-field-attachment-1'), {
      dataTransfer: { files: [new File(['content'], 'dropped.pdf', { type: 'application/pdf' })] },
    });

    await waitFor(() => {
      expect(screen.getByText('dropped.pdf')).toBeVisible();
    });
  });

  test('does not add files when dropped on a read-only component', () => {
    renderAttachmentField({ readOnly: true });

    fireEvent.drop(screen.getByTestId('schema-form-attachment-field-attachment-1'), {
      dataTransfer: { files: [new File(['content'], 'dropped.pdf', { type: 'application/pdf' })] },
    });

    expect(screen.queryByText('dropped.pdf')).not.toBeInTheDocument();
  });

  test('creates a preview URL for image files', async () => {
    renderAttachmentField();

    await userEvent.upload(getFileInput(), new File(['content'], 'photo.png', { type: 'image/png' }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  test('does not create a preview URL for non-image files', async () => {
    renderAttachmentField();

    await userEvent.upload(getFileInput(), new File(['content'], 'test.pdf', { type: 'application/pdf' }));

    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
