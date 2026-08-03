import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen, waitFor } from '../../../test-utils';
import { TrackerContext } from '../../../utils/analytics';
import { downloadFileFromUrl } from '../../../utils/download';
import { fetchImageAsBase64FromUrl } from '../../../utils/file';
import { mockStore } from '../../../__test-helpers/MockStore';
import { removeFile, uploadFile } from '../../../ducks/user-content';
import { showToast } from '../../../utils/toast';

import Attachment from './';

jest.mock('../../../ducks/user-content', () => ({
  removeFile: jest.fn(),
  uploadFile: jest.fn(),
}));

jest.mock('../../../utils/download', () => ({
  ...jest.requireActual('../../../utils/download'),
  downloadFileFromUrl: jest.fn(),
}));

jest.mock('../../../utils/file', () => ({
  ...jest.requireActual('../../../utils/file'),
  fetchImageAsBase64FromUrl: jest.fn(),
}));

jest.mock('../../../utils/toast', () => ({
  showToast: jest.fn(),
}));

describe('SchemaForm - formElements - Attachment', () => {
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

    uploadFile.mockImplementation(() => () => 'test-upload-id');
    removeFile.mockImplementation(() => () => {});
    fetchImageAsBase64FromUrl.mockResolvedValue('data:image/png;base64,test');
    downloadFileFromUrl.mockImplementation(() => {});
  });

  const renderAttachmentField = (props, overrideStore) => render(
    <Provider store={overrideStore ?? store}>
      <TrackerContext.Provider value={null}>
        <Attachment
          details={details}
          error={undefined}
          id="attachment-1"
          onFieldChange={onFieldChange}
          value={[]}
          {...props}
        />
      </TrackerContext.Provider>
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

  test('does not show the description', () => {
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
    renderAttachmentField({ value: [{ uploadId: 'saved-1' }] });

    expect(screen.queryByText('Drag and drop files here')).not.toBeInTheDocument();
  });

  test('shows the attachment name from attachmentsMetadata', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'path/to/file1.pdf', file_type: 'document', files: { original: 'https://example.com/file1.pdf' } },
        'saved-2': { filename: 'path/to/file2.png', file_type: 'image', files: { original: 'https://example.com/file2.png', thumbnail: 'https://example.com/file2_thumb.png' } },
      },
      value: [{ uploadId: 'saved-1' }, { uploadId: 'saved-2' }],
    });

    expect(screen.getByText('file1.pdf')).toBeVisible();
    expect(screen.getByText('file2.png')).toBeVisible();
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
    expect(chooseFileButton).not.toBeDisabled();
  });

  test('clicking the choose file button triggers the file input', async () => {
    renderAttachmentField();

    const fileInput = getFileInput();
    const clickSpy = jest.spyOn(fileInput, 'click');

    await userEvent.click(screen.getByRole('button', { name: 'Choose File' }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  test('disables the choose file button when the maximum number of files is reached', () => {
    details.maxItems = 2;
    renderAttachmentField({ value: [
      { uploadId: 'saved-1' },
      { uploadId: 'saved-2' },
    ] });

    expect(screen.getByRole('button', { name: 'Choose File' })).toBeDisabled();
  });

  test('does not disable the choose file button when the maximum is not reached', () => {
    details.maxItems = 3;
    renderAttachmentField({ value: [{ uploadId: 'saved-1' }] });

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

  test('sets the accept attribute on the file input based on multiple allowed file types', () => {
    details.allowableFileTypes = ['image', 'audio'];
    renderAttachmentField();

    expect(getFileInput()).toHaveAttribute('accept', expect.stringContaining('image/*'));
    expect(getFileInput()).toHaveAttribute('accept', expect.stringContaining('audio/*'));
  });

  test('dispatches uploadFile and calls onFieldChange when a file is selected', async () => {
    renderAttachmentField();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await userEvent.upload(getFileInput(), file);

    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(uploadFile).toHaveBeenCalledWith(file);
    expect(onFieldChange).toHaveBeenCalledWith('attachment-1', [{ uploadId: 'test-upload-id' }]);
  });

  test('dispatches uploadFile for each file and calls onFieldChange when multiple files are selected', async () => {
    renderAttachmentField();
    const file1 = new File(['content'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['content'], 'test2.pdf', { type: 'application/pdf' });

    await userEvent.upload(getFileInput(), [file1, file2]);

    expect(uploadFile).toHaveBeenCalledTimes(2);
    expect(uploadFile).toHaveBeenCalledWith(file1);
    expect(uploadFile).toHaveBeenCalledWith(file2);
    expect(onFieldChange).toHaveBeenCalledWith('attachment-1', [
      { uploadId: 'test-upload-id' },
      { uploadId: 'test-upload-id' },
    ]);
  });

  test('announces the upload start to screen readers', async () => {
    renderAttachmentField();

    await userEvent.upload(getFileInput(), new File(['content'], 'test.pdf', { type: 'application/pdf' }));

    expect(screen.getByRole('status')).toHaveTextContent('Uploading test.pdf');
  });

  test('shows an indeterminate progress indicator when a file is being prepared', () => {
    const uploadStore = mockStore({
      data: { userContent: { 'test-upload-id': { uploadId: 'test-upload-id', filename: 'test.pdf', fileType: 'application/pdf', progress: null, status: 'in_progress' } } },
    });
    renderAttachmentField({ value: [{ uploadId: 'test-upload-id' }] }, uploadStore);

    const progressIndicator = screen.getByTestId('upload-progress-test-upload-id');

    expect(progressIndicator).toBeInTheDocument();
    expect(progressIndicator).toHaveClass('indeterminate');
    expect(progressIndicator).toHaveStyle({ '--upload-progress': '0%' });
  });

  test('shows the in-progress upload progress indicator with its current progress', () => {
    const uploadStore = mockStore({
      data: { userContent: { 'test-upload-id': { uploadId: 'test-upload-id', filename: 'test.pdf', fileType: 'application/pdf', progress: 0.6, status: 'in_progress' } } },
    });
    renderAttachmentField({ value: [{ uploadId: 'test-upload-id' }] }, uploadStore);

    const progressIndicator = screen.getByTestId('upload-progress-test-upload-id');

    expect(progressIndicator).toBeInTheDocument();
    expect(progressIndicator).not.toHaveClass('indeterminate');
    expect(progressIndicator).toHaveStyle({ '--upload-progress': '60%' });
  });

  test('shows an indeterminate progress indicator for a remote in-progress upload', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'file1.pdf', file_type: 'document', status: 'in_progress' },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    const progressIndicator = screen.getByTestId('upload-progress-saved-1');

    expect(progressIndicator).toBeInTheDocument();
    expect(progressIndicator).toHaveClass('indeterminate');
    expect(progressIndicator).toHaveStyle({ '--upload-progress': '0%' });
  });

  test('shows a thumbnail image for a saved image attachment after fetching its data', async () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': {
          filename: 'photo.png',
          file_type: 'image',
          files: { original: 'https://example.com/photo.png', thumbnail: 'https://example.com/photo_thumb.png' },
        },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    await waitFor(() => {
      const img = document.querySelector('img');

      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'data:image/png;base64,test');
    });
  });

  test('fetches the original and thumbnail image data for saved images with metadata', async () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': {
          filename: 'photo.png',
          file_type: 'image',
          files: { original: 'https://example.com/photo.png', thumbnail: 'https://example.com/photo_thumb.png' },
        },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    await waitFor(() => {
      expect(fetchImageAsBase64FromUrl).toHaveBeenCalledTimes(2);
    });
    expect(fetchImageAsBase64FromUrl).toHaveBeenCalledWith('https://example.com/photo.png');
    expect(fetchImageAsBase64FromUrl).toHaveBeenCalledWith('https://example.com/photo_thumb.png');
  });

  test('does not fetch image data for non-image saved attachments', async () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'file.pdf', file_type: 'document', files: { original: 'https://example.com/file.pdf' } },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    await waitFor(() => {
      expect(fetchImageAsBase64FromUrl).not.toHaveBeenCalled();
    });
  });

  test('shows the expand button for a saved image attachment', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'photo.png', file_type: 'image', files: { original: 'https://example.com/photo.png', thumbnail: 'https://example.com/photo_thumb.png' } },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    const expandButton = screen.getByRole('button', { name: 'Expand photo.png' });

    expect(expandButton).toBeVisible();
    expect(expandButton).toHaveAttribute('type', 'button');
    expect(expandButton).toHaveAttribute('aria-label', 'Expand photo.png');
    expect(expandButton).toHaveAttribute('title', 'Expand photo.png');
  });

  test('disables the expand button for a saved image attachment while the image source is loading', () => {
    fetchImageAsBase64FromUrl.mockImplementation(() => new Promise(() => {}));

    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'photo.png', file_type: 'image', files: { original: 'https://example.com/photo.png', thumbnail: 'https://example.com/photo_thumb.png' } },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    expect(screen.getByRole('button', { name: 'Expand photo.png' })).toBeDisabled();
  });

  test('enables the expand button for a saved image attachment once the image source has loaded', async () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'photo.png', file_type: 'image', files: { original: 'https://example.com/photo.png', thumbnail: 'https://example.com/photo_thumb.png' } },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Expand photo.png' })).not.toBeDisabled();
    });
  });

  test('shows the download button for a saved non-image attachment', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'file1.pdf', file_type: 'document', files: { original: 'https://example.com/file1.pdf' } },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    const downloadButton = screen.getByRole('button', { name: 'Download file1.pdf' });

    expect(downloadButton).toBeVisible();
    expect(downloadButton).toHaveAttribute('type', 'button');
    expect(downloadButton).toHaveAttribute('aria-label', 'Download file1.pdf');
    expect(downloadButton).toHaveAttribute('title', 'Download file1.pdf');
  });

  test('disables the download button for a saved non-image attachment with no original URL', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'file1.pdf', file_type: 'document' },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    expect(screen.getByRole('button', { name: 'Download file1.pdf' })).toBeDisabled();
  });

  test('does not show a remove button for a saved attachment', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'file1.pdf', file_type: 'document', files: { original: 'https://example.com/file1.pdf' } },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    expect(screen.queryByRole('button', { name: 'Remove file1.pdf' })).not.toBeInTheDocument();
  });

  test('shows the remove button for an local in-progress upload', () => {
    const uploadStore = mockStore({
      data: { userContent: { 'test-upload-id': { uploadId: 'test-upload-id', filename: 'test.pdf', fileType: 'application/pdf', progress: 0, status: 'in_progress' } } },
    });
    renderAttachmentField({ value: [{ uploadId: 'test-upload-id' }] }, uploadStore);

    const removeButton = screen.getByRole('button', { name: 'Remove test.pdf' });

    expect(removeButton).toBeVisible();
    expect(removeButton).toHaveAttribute('type', 'button');
    expect(removeButton).toHaveAttribute('aria-label', 'Remove test.pdf');
    expect(removeButton).toHaveAttribute('title', 'Remove test.pdf');
  });

  test('does not show the remove button for an local in-progress upload in read-only mode', () => {
    const uploadStore = mockStore({
      data: { userContent: { 'test-upload-id': { uploadId: 'test-upload-id', filename: 'test.pdf', fileType: 'application/pdf', progress: 0, status: 'in_progress' } } },
    });
    renderAttachmentField({ readOnly: true, value: [{ uploadId: 'test-upload-id' }] }, uploadStore);

    expect(screen.queryByRole('button', { name: 'Remove test.pdf' })).not.toBeInTheDocument();
  });

  test('does not show an action button for a remote in-progress upload', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'file1.pdf', file_type: 'document', status: 'in_progress' },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    expect(screen.queryByRole('button', { name: 'Remove file1.pdf' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download file1.pdf' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Expand file1.pdf' })).not.toBeInTheDocument();
  });

  test('shows a pending label for a remote upload with unknown status and does not show an action button', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'file1.pdf', file_type: 'document', status: 'unknown' },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    expect(screen.getByText('file1.pdf')).toBeVisible();
    expect(screen.getByText('Pending')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Remove file1.pdf' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download file1.pdf' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Expand file1.pdf' })).not.toBeInTheDocument();
  });

  test('shows the upload error text for a failed upload', () => {
    const failedStore = mockStore({
      data: { userContent: { 'test-upload-id': { uploadId: 'test-upload-id', filename: 'test.pdf', fileType: 'application/pdf', progress: 0, status: 'failed' } } },
    });
    renderAttachmentField({ value: [{ uploadId: 'test-upload-id' }] }, failedStore);

    expect(screen.getByText('Upload failed')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove test.pdf' })).toBeVisible();
  });

  test('dispatches addModal when the expand button is clicked for a saved image', async () => {
    const mockStoreInstance = mockStore({ data: { userContent: {} } });
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'photo.png', file_type: 'image', files: { original: 'https://example.com/photo.png', thumbnail: 'https://example.com/photo_thumb.png' } },
      },
      value: [{ uploadId: 'saved-1' }],
    }, mockStoreInstance);

    await userEvent.click(screen.getByRole('button', { name: 'Expand photo.png' }));

    const actions = mockStoreInstance.getActions();

    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('ADD_MODAL');
    expect(actions[0].payload.title).toBe('photo.png');
    expect(actions[0].payload.url).toBe('https://example.com/photo.png');
  });

  test('shows the download button and no thumbnail for a saved audio attachment', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'audio.mp3', file_type: 'audio', files: { original: 'https://example.com/audio.mp3' } },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    expect(screen.getByText('audio.mp3')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Download audio.mp3' })).toBeVisible();
    expect(document.querySelector('img')).not.toBeInTheDocument();
  });

  test('shows the download button and no thumbnail for a saved video attachment', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'video.mp4', file_type: 'video', files: { original: 'https://example.com/video.mp4' } },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    expect(screen.getByText('video.mp4')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Download video.mp4' })).toBeVisible();
    expect(document.querySelector('img')).not.toBeInTheDocument();
  });

  test('shows the expand button for a saved image attachment in read-only mode', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'photo.png', file_type: 'image', files: { original: 'https://example.com/photo.png', thumbnail: 'https://example.com/photo_thumb.png' } },
      },
      readOnly: true,
      value: [{ uploadId: 'saved-1' }],
    });

    expect(screen.getByRole('button', { name: 'Expand photo.png' })).toBeVisible();
  });

  test('shows the download button for a saved non-image attachment in read-only mode', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'file1.pdf', file_type: 'document', files: { original: 'https://example.com/file1.pdf' } },
      },
      readOnly: true,
      value: [{ uploadId: 'saved-1' }],
    });

    expect(screen.getByRole('button', { name: 'Download file1.pdf' })).toBeVisible();
  });

  test('calls downloadFileFromUrl when the download button is clicked', async () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'file1.pdf', file_type: 'document', files: { original: 'https://example.com/file1.pdf' } },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    await userEvent.click(screen.getByRole('button', { name: 'Download file1.pdf' }));

    expect(downloadFileFromUrl).toHaveBeenCalledTimes(1);
    expect(downloadFileFromUrl).toHaveBeenCalledWith('https://example.com/file1.pdf', { filename: 'file1.pdf' });
  });

  test('dispatches removeFile when the remove button is clicked', async () => {
    const uploadStore = mockStore({
      data: { userContent: { 'test-upload-id': { uploadId: 'test-upload-id', filename: 'test.pdf', fileType: 'application/pdf', progress: 0, status: 'in_progress' } } },
    });
    renderAttachmentField({ value: [{ uploadId: 'test-upload-id' }] }, uploadStore);

    await userEvent.click(screen.getByRole('button', { name: 'Remove test.pdf' }));

    expect(removeFile).toHaveBeenCalledTimes(1);
    expect(removeFile).toHaveBeenCalledWith('test-upload-id');
  });

  test('calls onFieldChange when the remove button is clicked', async () => {
    const uploadStore = mockStore({
      data: { userContent: { 'test-upload-id': { uploadId: 'test-upload-id', filename: 'test.pdf', fileType: 'application/pdf', progress: 0, status: 'in_progress' } } },
    });
    renderAttachmentField({ value: [{ uploadId: 'test-upload-id' }] }, uploadStore);

    await userEvent.click(screen.getByRole('button', { name: 'Remove test.pdf' }));

    expect(onFieldChange).toHaveBeenCalledWith('attachment-1', []);
  });

  test('announces completed uploads to screen readers', () => {
    const pendingStore = mockStore({
      data: { userContent: { 'test-upload-id': { uploadId: 'test-upload-id', filename: 'test.pdf', progress: 0, status: 'in_progress' } } },
    });
    const { rerender } = renderAttachmentField({ value: [{ uploadId: 'test-upload-id' }] }, pendingStore);

    const completedStore = mockStore({
      data: { userContent: { 'test-upload-id': { uploadId: 'test-upload-id', filename: 'test.pdf', progress: 1, status: 'complete' } } },
    });
    rerender(
      <Provider store={completedStore}>
        <TrackerContext.Provider value={null}>
          <Attachment
            details={details}
            error={undefined}
            id="attachment-1"
            onFieldChange={onFieldChange}
            value={[{ uploadId: 'test-upload-id' }]}
          />
        </TrackerContext.Provider>
      </Provider>
    );

    expect(screen.getByRole('status')).toHaveTextContent('test.pdf uploaded');
  });

  test('announces failed uploads to screen readers', () => {
    const pendingStore = mockStore({
      data: { userContent: { 'test-upload-id': { uploadId: 'test-upload-id', filename: 'test.pdf', progress: 0, status: 'in_progress' } } },
    });
    const { rerender } = renderAttachmentField({ value: [{ uploadId: 'test-upload-id' }] }, pendingStore);

    const failedStore = mockStore({
      data: { userContent: { 'test-upload-id': { uploadId: 'test-upload-id', filename: 'test.pdf', progress: 0, status: 'failed' } } },
    });
    rerender(
      <Provider store={failedStore}>
        <TrackerContext.Provider value={null}>
          <Attachment
            details={details}
            error={undefined}
            id="attachment-1"
            onFieldChange={onFieldChange}
            value={[{ uploadId: 'test-upload-id' }]}
          />
        </TrackerContext.Provider>
      </Provider>
    );

    expect(screen.getByRole('status')).toHaveTextContent("test.pdf couldn't be uploaded");
  });

  test('announces multiple completed uploads to screen readers', () => {
    const pendingStore = mockStore({
      data: { userContent: {
        'upload-1': { uploadId: 'upload-1', filename: 'file1.pdf', progress: 0, status: 'in_progress' },
        'upload-2': { uploadId: 'upload-2', filename: 'file2.pdf', progress: 0, status: 'in_progress' },
      } },
    });
    const { rerender } = renderAttachmentField({
      value: [{ uploadId: 'upload-1' }, { uploadId: 'upload-2' }],
    }, pendingStore);

    const completedStore = mockStore({
      data: { userContent: {
        'upload-1': { uploadId: 'upload-1', filename: 'file1.pdf', progress: 1, status: 'complete' },
        'upload-2': { uploadId: 'upload-2', filename: 'file2.pdf', progress: 1, status: 'complete' },
      } },
    });
    rerender(
      <Provider store={completedStore}>
        <TrackerContext.Provider value={null}>
          <Attachment
            details={details}
            error={undefined}
            id="attachment-1"
            onFieldChange={onFieldChange}
            value={[{ uploadId: 'upload-1' }, { uploadId: 'upload-2' }]}
          />
        </TrackerContext.Provider>
      </Provider>
    );

    expect(screen.getByRole('status')).toHaveTextContent('2 files uploaded');
  });

  test('announces multiple failed uploads to screen readers', () => {
    const pendingStore = mockStore({
      data: { userContent: {
        'upload-1': { uploadId: 'upload-1', filename: 'file1.pdf', progress: 0, status: 'in_progress' },
        'upload-2': { uploadId: 'upload-2', filename: 'file2.pdf', progress: 0, status: 'in_progress' },
      } },
    });
    const { rerender } = renderAttachmentField({
      value: [{ uploadId: 'upload-1' }, { uploadId: 'upload-2' }],
    }, pendingStore);

    const failedStore = mockStore({
      data: { userContent: {
        'upload-1': { uploadId: 'upload-1', filename: 'file1.pdf', progress: 0, status: 'failed' },
        'upload-2': { uploadId: 'upload-2', filename: 'file2.pdf', progress: 0, status: 'failed' },
      } },
    });
    rerender(
      <Provider store={failedStore}>
        <TrackerContext.Provider value={null}>
          <Attachment
            details={details}
            error={undefined}
            id="attachment-1"
            onFieldChange={onFieldChange}
            value={[{ uploadId: 'upload-1' }, { uploadId: 'upload-2' }]}
          />
        </TrackerContext.Provider>
      </Provider>
    );

    expect(screen.getByRole('status')).toHaveTextContent("2 files couldn't be uploaded");
  });

  test('announces both completed and failed uploads when they occur in the same update', () => {
    const pendingStore = mockStore({
      data: { userContent: {
        'upload-1': { uploadId: 'upload-1', filename: 'file1.pdf', progress: 0, status: 'in_progress' },
        'upload-2': { uploadId: 'upload-2', filename: 'file2.pdf', progress: 0, status: 'in_progress' },
      } },
    });
    const { rerender } = renderAttachmentField({
      value: [{ uploadId: 'upload-1' }, { uploadId: 'upload-2' }],
    }, pendingStore);

    const mixedStore = mockStore({
      data: { userContent: {
        'upload-1': { uploadId: 'upload-1', filename: 'file1.pdf', progress: 1, status: 'complete' },
        'upload-2': { uploadId: 'upload-2', filename: 'file2.pdf', progress: 0, status: 'failed' },
      } },
    });
    rerender(
      <Provider store={mixedStore}>
        <TrackerContext.Provider value={null}>
          <Attachment
            details={details}
            error={undefined}
            id="attachment-1"
            onFieldChange={onFieldChange}
            value={[{ uploadId: 'upload-1' }, { uploadId: 'upload-2' }]}
          />
        </TrackerContext.Provider>
      </Provider>
    );

    expect(screen.getByRole('status')).toHaveTextContent('file1.pdf uploaded');
    expect(screen.getByRole('status')).toHaveTextContent('file2.pdf couldn\'t be uploaded');
  });

  test('moves focus to the closest action button when removing an attachment', async () => {
    const uploadStore = mockStore({
      data: { userContent: {
        'upload-1': { uploadId: 'upload-1', filename: 'file1.pdf', fileType: 'application/pdf', progress: 0, status: 'in_progress' },
      } },
    });
    const attachmentsMetadata = {
      'saved-1': { filename: 'file2.pdf', file_type: 'document', status: 'unknown' },
      'saved-2': { filename: 'file3.pdf', file_type: 'document', files: { original: 'https://example.com/file3.pdf' } },
    };
    const { rerender } = renderAttachmentField({
      attachmentsMetadata,
      value: [{ uploadId: 'upload-1' }, { uploadId: 'saved-1' }, { uploadId: 'saved-2' }],
    }, uploadStore);

    await userEvent.click(screen.getByRole('button', { name: 'Remove file1.pdf' }));

    rerender(
      <Provider store={store}>
        <TrackerContext.Provider value={null}>
          <Attachment
            attachmentsMetadata={attachmentsMetadata}
            details={details}
            error={undefined}
            id="attachment-1"
            onFieldChange={onFieldChange}
            value={[{ uploadId: 'saved-1' }, { uploadId: 'saved-2' }]}
          />
        </TrackerContext.Provider>
      </Provider>
    );

    expect(screen.getByRole('button', { name: 'Download file3.pdf' })).toHaveFocus();
  });

  test('moves focus to the choose file button when there are no attachments with action buttons remaining', async () => {
    const uploadStore = mockStore({
      data: { userContent: {
        'upload-1': { uploadId: 'upload-1', filename: 'file1.pdf', fileType: 'application/pdf', progress: 0, status: 'in_progress' },
      } },
    });
    const attachmentsMetadata = {
      'saved-1': { filename: 'file2.pdf', file_type: 'document', status: 'unknown' },
    };
    const { rerender } = renderAttachmentField({
      attachmentsMetadata,
      value: [{ uploadId: 'upload-1' }, { uploadId: 'saved-1' }],
    }, uploadStore);

    await userEvent.click(screen.getByRole('button', { name: 'Remove file1.pdf' }));

    rerender(
      <Provider store={store}>
        <TrackerContext.Provider value={null}>
          <Attachment
            attachmentsMetadata={attachmentsMetadata}
            details={details}
            error={undefined}
            id="attachment-1"
            onFieldChange={onFieldChange}
            value={[{ uploadId: 'saved-1' }]}
          />
        </TrackerContext.Provider>
      </Provider>
    );

    expect(screen.getByRole('button', { name: 'Choose File' })).toHaveFocus();
  });

  test('skips a disabled action button and moves focus to the choose file button', async () => {
    const uploadStore = mockStore({
      data: { userContent: {
        'upload-1': { uploadId: 'upload-1', filename: 'file1.pdf', fileType: 'application/pdf', progress: 0, status: 'in_progress' },
      } },
    });
    const attachmentsMetadata = {
      'saved-1': { filename: 'file2.pdf', file_type: 'document' },
    };
    const { rerender } = renderAttachmentField({
      attachmentsMetadata,
      value: [{ uploadId: 'upload-1' }, { uploadId: 'saved-1' }],
    }, uploadStore);

    const downloadButton = screen.getByRole('button', { name: 'Download file2.pdf' });
    expect(downloadButton).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Remove file1.pdf' }));

    rerender(
      <Provider store={store}>
        <TrackerContext.Provider value={null}>
          <Attachment
            attachmentsMetadata={attachmentsMetadata}
            details={details}
            error={undefined}
            id="attachment-1"
            onFieldChange={onFieldChange}
            value={[{ uploadId: 'saved-1' }]}
          />
        </TrackerContext.Provider>
      </Provider>
    );

    expect(screen.getByRole('button', { name: 'Choose File' })).toHaveFocus();
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

  test('prevents the default dragOver behavior to allow dropping', () => {
    renderAttachmentField();

    expect(fireEvent.dragOver(screen.getByTestId('schema-form-attachment-field-attachment-1'))).toBe(false);
  });

  test('does not prevent the default dragOver behavior in read-only mode', () => {
    renderAttachmentField({ readOnly: true });

    expect(fireEvent.dragOver(screen.getByTestId('schema-form-attachment-field-attachment-1'))).toBe(true);
  });

  test('applies the dragging-over style to the file list when files are present', () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'file1.pdf', file_type: 'document', files: { original: 'https://example.com/file1.pdf' } },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    fireEvent.dragEnter(screen.getByTestId('schema-form-attachment-field-attachment-1'));

    expect(screen.getByRole('list')).toHaveClass('draggingOver');
  });

  test('does not apply the dragging-over style when max items is reached', () => {
    details.maxItems = 1;
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'file1.pdf', file_type: 'document', files: { original: 'https://example.com/file1.pdf' } },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    fireEvent.dragEnter(screen.getByTestId('schema-form-attachment-field-attachment-1'));

    expect(screen.getByRole('list')).not.toHaveClass('draggingOver');
  });

  test('does not apply the dragging-over style in read-only mode', () => {
    renderAttachmentField({ readOnly: true });

    fireEvent.dragEnter(screen.getByTestId('schema-form-attachment-field-attachment-1'));

    expect(getDropzone()).not.toHaveClass('draggingOver');
  });

  test('adds files when they are dropped on the component', () => {
    renderAttachmentField();

    fireEvent.drop(screen.getByTestId('schema-form-attachment-field-attachment-1'), {
      dataTransfer: { files: [new File(['content'], 'dropped.pdf', { type: 'application/pdf' })] },
    });

    expect(onFieldChange).toHaveBeenCalledWith('attachment-1', [{ uploadId: 'test-upload-id' }]);
  });

  test('does not add files when dropped on a read-only component', () => {
    renderAttachmentField({ readOnly: true });

    fireEvent.drop(screen.getByTestId('schema-form-attachment-field-attachment-1'), {
      dataTransfer: { files: [new File(['content'], 'dropped.pdf', { type: 'application/pdf' })] },
    });

    expect(onFieldChange).not.toHaveBeenCalled();
  });

  test('shows a toast when a file with a disallowed type is added', () => {
    details.allowableFileTypes = ['image'];
    renderAttachmentField();

    fireEvent.drop(screen.getByTestId('schema-form-attachment-field-attachment-1'), {
      dataTransfer: { files: [new File(['content'], 'test.pdf', { type: 'application/pdf' })] },
    });

    expect(showToast).toHaveBeenCalledWith({
      message: "test.pdf can't be added because its file type isn't allowed.",
    });
  });

  test('does not add a file with a disallowed type to the list', () => {
    details.allowableFileTypes = ['image'];
    renderAttachmentField();

    fireEvent.drop(screen.getByTestId('schema-form-attachment-field-attachment-1'), {
      dataTransfer: { files: [new File(['content'], 'test.pdf', { type: 'application/pdf' })] },
    });

    expect(onFieldChange).not.toHaveBeenCalled();
  });

  test('adds only the allowed files and shows a toast for the rejected ones when mixed file types are dropped', () => {
    details.allowableFileTypes = ['image'];
    renderAttachmentField();

    fireEvent.drop(screen.getByTestId('schema-form-attachment-field-attachment-1'), {
      dataTransfer: { files: [
        new File(['content'], 'photo.png', { type: 'image/png' }),
        new File(['content'], 'test.pdf', { type: 'application/pdf' }),
      ] },
    });

    expect(onFieldChange).toHaveBeenCalledWith('attachment-1', [{ uploadId: 'test-upload-id' }]);
    expect(showToast).toHaveBeenCalledWith({
      message: "test.pdf can't be added because its file type isn't allowed.",
    });
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

  test('only calls onFieldChange with files up to the maximum allowed', async () => {
    details.maxItems = 1;
    renderAttachmentField();

    await userEvent.upload(getFileInput(), [
      new File(['content'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['content'], 'test2.pdf', { type: 'application/pdf' }),
    ]);

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('attachment-1', [{ uploadId: 'test-upload-id' }]);
  });

  test('shows a toast when a file with a duplicate name is selected', async () => {
    renderAttachmentField({
      attachmentsMetadata: {
        'saved-1': { filename: 'existing.pdf', file_type: 'document', files: { original: 'https://example.com/existing.pdf' } },
      },
      value: [{ uploadId: 'saved-1' }],
    });

    await userEvent.upload(
      getFileInput(),
      new File(['content'], 'existing.pdf', { type: 'application/pdf' })
    );

    expect(showToast).toHaveBeenCalled();
    expect(onFieldChange).not.toHaveBeenCalled();
  });
});
