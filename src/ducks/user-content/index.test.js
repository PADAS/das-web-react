import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import userContentReducer, {
  ABORT_CONTROLLERS,
  CLEAR,
  clearUserContent,
  COMMUNITY_COMPLETE_CHUNKED_UPLOAD_API_URL,
  COMMUNITY_INITIATE_CHUNKED_UPLOAD_API_URL,
  COMMUNITY_UPLOAD_CHUNK_API_URL,
  COMPLETE_CHUNKED_UPLOAD_API_URL,
  INITIAL_STATE,
  INITIATE_CHUNKED_UPLOAD_API_URL,
  removeFile,
  REMOVE_UPLOAD,
  SET_CHUNKED_UPLOAD_STATUS,
  startChunkedUpload,
  SUGGESTED_CHUNK_SIZE,
  UPLOAD_CHUNK_API_URL,
  uploadFile,
} from './';

const MOCK_COMMUNITY_INPUT_VALUE = 'test-community-input';
const MOCK_UPLOAD_ID = 'test-upload-id';

jest.mock('uuid', () => ({ v4: () => MOCK_UPLOAD_ID }));

const server = setupServer(
  http.post(INITIATE_CHUNKED_UPLOAD_API_URL, () =>
    HttpResponse.json({ data: { chunk_size: SUGGESTED_CHUNK_SIZE, num_chunks: 1 } })
  ),
  http.put(UPLOAD_CHUNK_API_URL(MOCK_UPLOAD_ID, 0), () => HttpResponse.json({})),
  http.post(COMPLETE_CHUNKED_UPLOAD_API_URL(MOCK_UPLOAD_ID), () => HttpResponse.json({})),
  http.post(COMMUNITY_INITIATE_CHUNKED_UPLOAD_API_URL(MOCK_COMMUNITY_INPUT_VALUE), () =>
    HttpResponse.json({ data: { chunk_size: SUGGESTED_CHUNK_SIZE, num_chunks: 1 } })
  ),
  http.put(
    COMMUNITY_UPLOAD_CHUNK_API_URL(MOCK_COMMUNITY_INPUT_VALUE, MOCK_UPLOAD_ID, 0),
    () => HttpResponse.json({})
  ),
  http.post(
    COMMUNITY_COMPLETE_CHUNKED_UPLOAD_API_URL(MOCK_COMMUNITY_INPUT_VALUE, MOCK_UPLOAD_ID),
    () => HttpResponse.json({})
  ),
);

describe('Ducks - User content', () => {
  beforeAll(() => server.listen());

  afterEach(() => {
    ABORT_CONTROLLERS.clear();
    server.resetHandlers();
    jest.restoreAllMocks();
  });

  afterAll(() => server.close());

  test('clearUserContent aborts all in-progress uploads, clears the abort controllers map, revokes all the object URLs from the uploads that have one, and dispatches CLEAR_USER_CONTENT', () => {
    const controller1 = new AbortController();
    const controller2 = new AbortController();
    const abort1 = jest.spyOn(controller1, 'abort');
    const abort2 = jest.spyOn(controller2, 'abort');
    ABORT_CONTROLLERS.set('upload-1', controller1);
    ABORT_CONTROLLERS.set('upload-2', controller2);

    const mockObjectUrl = 'blob:http://localhost/mock-url';
    const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');

    const dispatch = jest.fn();
    const getState = () => ({
      data: {
        userContent: {
          'upload-1': { uploadId: 'upload-1', objectUrl: mockObjectUrl },
          'upload-2': { uploadId: 'upload-2' },
        },
      },
    });

    clearUserContent()(dispatch, getState);

    expect(abort1).toHaveBeenCalledTimes(1);
    expect(abort2).toHaveBeenCalledTimes(1);
    expect(ABORT_CONTROLLERS.size).toBe(0);
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockObjectUrl);
    expect(dispatch).toHaveBeenCalledWith({ type: CLEAR });
  });

  test('removeFile dispatches the REMOVE_UPLOAD action and aborts any in-progress upload', async () => {
    const abortController = new AbortController();
    const abortSpy = jest.spyOn(abortController, 'abort');
    ABORT_CONTROLLERS.set(MOCK_UPLOAD_ID, abortController);

    const dispatch = jest.fn();
    const getState = () => ({ data: { userContent: {} } });

    removeFile(MOCK_UPLOAD_ID)(dispatch, getState);

    expect(abortSpy).toHaveBeenCalledTimes(1);
    expect(ABORT_CONTROLLERS.has(MOCK_UPLOAD_ID)).toBe(false);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      payload: { uploadId: MOCK_UPLOAD_ID },
      type: REMOVE_UPLOAD,
    });
  });

  test('removeFile revokes the object URL when one exists in state', async () => {
    const mockObjectUrl = 'blob:http://localhost/mock-url';
    const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');

    const dispatch = jest.fn();
    const getState = () => ({
      data: { userContent: { [MOCK_UPLOAD_ID]: { objectUrl: mockObjectUrl } } },
    });

    removeFile(MOCK_UPLOAD_ID)(dispatch, getState);

    expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockObjectUrl);
  });

  test('uploadFile dispatches the SET_CHUNKED_UPLOAD_STATUS action when the upload state is in progress', async () => {
    const dispatch = jest.fn();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    uploadFile(file)(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      payload: {
        filename: 'test.pdf',
        fileType: 'application/pdf',
        objectUrl: undefined,
        progress: null,
        status: 'in_progress',
        uploadId: MOCK_UPLOAD_ID,
      },
      type: SET_CHUNKED_UPLOAD_STATUS,
    });
  });

  test('uploadFile includes an object URL in the initial dispatch for image files', async () => {
    const mockObjectUrl = 'blob:http://localhost/mock-url';
    jest.spyOn(URL, 'createObjectURL').mockReturnValue(mockObjectUrl);

    const dispatch = jest.fn();
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    uploadFile(file)(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      payload: {
        filename: 'test.jpg',
        fileType: 'image/jpeg',
        objectUrl: mockObjectUrl,
        progress: null,
        status: 'in_progress',
        uploadId: MOCK_UPLOAD_ID,
      },
      type: SET_CHUNKED_UPLOAD_STATUS,
    });
  });

  test('uploadFile dispatches the SET_CHUNKED_UPLOAD_STATUS action once the upload starts', async () => {
    const dispatch = jest.fn();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const abortController = new AbortController();
    ABORT_CONTROLLERS.set(MOCK_UPLOAD_ID, abortController);

    await startChunkedUpload(file, MOCK_UPLOAD_ID, dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      payload: { progress: 0, status: 'in_progress', uploadId: MOCK_UPLOAD_ID },
      type: SET_CHUNKED_UPLOAD_STATUS,
    });
  });

  test('uploadFile dispatches the SET_CHUNKED_UPLOAD_STATUS action when the upload state is complete', async () => {
    const dispatch = jest.fn();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const abortController = new AbortController();
    ABORT_CONTROLLERS.set(MOCK_UPLOAD_ID, abortController);

    await startChunkedUpload(file, MOCK_UPLOAD_ID, dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      payload: { progress: 1, status: 'complete', uploadId: MOCK_UPLOAD_ID },
      type: SET_CHUNKED_UPLOAD_STATUS,
    });
  });

  test('uploadFile dispatches the SET_CHUNKED_UPLOAD_STATUS action for each uploaded chunk', async () => {
    server.use(
      http.post(INITIATE_CHUNKED_UPLOAD_API_URL, () =>
        HttpResponse.json({ data: { chunk_size: SUGGESTED_CHUNK_SIZE, num_chunks: 2 } })
      ),
      http.put(UPLOAD_CHUNK_API_URL(MOCK_UPLOAD_ID, 1), () => HttpResponse.json({})),
    );

    const dispatch = jest.fn();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const abortController = new AbortController();
    ABORT_CONTROLLERS.set(MOCK_UPLOAD_ID, abortController);

    await startChunkedUpload(file, MOCK_UPLOAD_ID, dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      payload: { progress: 0.5, status: 'in_progress', uploadId: MOCK_UPLOAD_ID },
      type: SET_CHUNKED_UPLOAD_STATUS,
    });
    expect(dispatch).toHaveBeenCalledWith({
      payload: { progress: 1, status: 'in_progress', uploadId: MOCK_UPLOAD_ID },
      type: SET_CHUNKED_UPLOAD_STATUS,
    });
  });

  test('uploadFile dispatches the SET_CHUNKED_UPLOAD_STATUS action when the upload state is failed', async () => {
    server.use(
      http.post(INITIATE_CHUNKED_UPLOAD_API_URL, () => HttpResponse.json({}, { status: 500 })),
    );

    const dispatch = jest.fn();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const abortController = new AbortController();
    ABORT_CONTROLLERS.set(MOCK_UPLOAD_ID, abortController);

    await startChunkedUpload(file, MOCK_UPLOAD_ID, dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      payload: { status: 'failed', uploadId: MOCK_UPLOAD_ID },
      type: SET_CHUNKED_UPLOAD_STATUS,
    });
  });

  test('uploadFile requests the authenticated endpoints without skipping auth when there is no community input value', async () => {
    const postSpy = jest.spyOn(axios, 'post');
    const putSpy = jest.spyOn(axios, 'put');

    const dispatch = jest.fn();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const abortController = new AbortController();
    ABORT_CONTROLLERS.set(MOCK_UPLOAD_ID, abortController);

    await startChunkedUpload(file, MOCK_UPLOAD_ID, dispatch);

    expect(postSpy).toHaveBeenCalledWith(
      INITIATE_CHUNKED_UPLOAD_API_URL,
      { chunk_size: SUGGESTED_CHUNK_SIZE, filename: 'test.pdf', id: MOCK_UPLOAD_ID, size: file.size },
      { signal: abortController.signal }
    );
    expect(putSpy).toHaveBeenCalledWith(
      UPLOAD_CHUNK_API_URL(MOCK_UPLOAD_ID, 0),
      expect.anything(),
      { headers: { 'Content-Type': 'application/octet-stream' }, signal: abortController.signal }
    );
    expect(postSpy).toHaveBeenCalledWith(
      COMPLETE_CHUNKED_UPLOAD_API_URL(MOCK_UPLOAD_ID),
      {},
      { signal: abortController.signal }
    );
    expect(dispatch).toHaveBeenCalledWith({
      payload: { progress: 1, status: 'complete', uploadId: MOCK_UPLOAD_ID },
      type: SET_CHUNKED_UPLOAD_STATUS,
    });
  });

  test('uploadFile requests the community endpoints skipping auth when there is a community input value', async () => {
    const postSpy = jest.spyOn(axios, 'post');
    const putSpy = jest.spyOn(axios, 'put');

    const dispatch = jest.fn();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const abortController = new AbortController();
    ABORT_CONTROLLERS.set(MOCK_UPLOAD_ID, abortController);

    await startChunkedUpload(file, MOCK_UPLOAD_ID, dispatch, MOCK_COMMUNITY_INPUT_VALUE);

    expect(postSpy).toHaveBeenCalledWith(
      COMMUNITY_INITIATE_CHUNKED_UPLOAD_API_URL(MOCK_COMMUNITY_INPUT_VALUE),
      { chunk_size: SUGGESTED_CHUNK_SIZE, filename: 'test.pdf', id: MOCK_UPLOAD_ID, size: file.size },
      { signal: abortController.signal, skipAuth: true }
    );
    expect(putSpy).toHaveBeenCalledWith(
      COMMUNITY_UPLOAD_CHUNK_API_URL(MOCK_COMMUNITY_INPUT_VALUE, MOCK_UPLOAD_ID, 0),
      expect.anything(),
      {
        headers: { 'Content-Type': 'application/octet-stream' },
        signal: abortController.signal,
        skipAuth: true,
      }
    );
    expect(postSpy).toHaveBeenCalledWith(
      COMMUNITY_COMPLETE_CHUNKED_UPLOAD_API_URL(MOCK_COMMUNITY_INPUT_VALUE, MOCK_UPLOAD_ID),
      {},
      { signal: abortController.signal, skipAuth: true }
    );
    expect(dispatch).toHaveBeenCalledWith({
      payload: { progress: 1, status: 'complete', uploadId: MOCK_UPLOAD_ID },
      type: SET_CHUNKED_UPLOAD_STATUS,
    });
  });

  test('uploadFile forwards the community input value it receives to the chunked upload', () => {
    const postSpy = jest.spyOn(axios, 'post');

    const dispatch = jest.fn();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    uploadFile(file, MOCK_COMMUNITY_INPUT_VALUE)(dispatch);

    expect(postSpy).toHaveBeenCalledWith(
      COMMUNITY_INITIATE_CHUNKED_UPLOAD_API_URL(MOCK_COMMUNITY_INPUT_VALUE),
      expect.anything(),
      expect.objectContaining({ skipAuth: true })
    );
  });

  test('uploadFile does not dispatch the SET_CHUNKED_UPLOAD_STATUS action when the upload is aborted', async () => {
    const dispatch = jest.fn();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const abortController = new AbortController();
    abortController.abort();
    ABORT_CONTROLLERS.set(MOCK_UPLOAD_ID, abortController);

    await startChunkedUpload(file, MOCK_UPLOAD_ID, dispatch);

    expect(dispatch).not.toHaveBeenCalled();
  });

  describe('userContentReducer', () => {
    test('returns the initial state', async () => {
      expect(userContentReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('handles a CLEAR_USER_CONTENT action', () => {
      const state = {
        [MOCK_UPLOAD_ID]: {
          filename: 'test.pdf',
          fileType: 'application/pdf',
          progress: 0.5,
          status: 'in_progress',
          uploadId: MOCK_UPLOAD_ID,
        },
      };

      expect(userContentReducer(state, { type: CLEAR })).toEqual(INITIAL_STATE);
    });

    test('handles a REMOVE_UPLOAD action', async () => {
      const state = {
        [MOCK_UPLOAD_ID]: {
          filename: 'test.pdf',
          fileType: 'application/pdf',
          progress: 1,
          status: 'complete',
          uploadId: MOCK_UPLOAD_ID,
        },
      };
      const action = { payload: { uploadId: MOCK_UPLOAD_ID }, type: REMOVE_UPLOAD };

      expect(userContentReducer(state, action)).toEqual({});
    });

    test('handles a SET_CHUNKED_UPLOAD_STATUS action', async () => {
      const payload = {
        filename: 'test.pdf',
        fileType: 'application/pdf',
        progress: null,
        status: 'in_progress',
        uploadId: MOCK_UPLOAD_ID,
      };
      const action = { payload, type: SET_CHUNKED_UPLOAD_STATUS };
      const expectedState = {
        [MOCK_UPLOAD_ID]: {
          filename: 'test.pdf',
          fileType: 'application/pdf',
          progress: null,
          status: 'in_progress',
          uploadId: MOCK_UPLOAD_ID,
        },
      };

      expect(userContentReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_CHUNKED_UPLOAD_STATUS action by merging into an existing entry', async () => {
      const state = {
        [MOCK_UPLOAD_ID]: {
          filename: 'test.pdf',
          fileType: 'application/pdf',
          progress: 0,
          status: 'in_progress',
          uploadId: MOCK_UPLOAD_ID,
        },
      };
      const payload = { progress: 0.5, status: 'in_progress', uploadId: MOCK_UPLOAD_ID };
      const action = { payload, type: SET_CHUNKED_UPLOAD_STATUS };
      const expectedState = {
        [MOCK_UPLOAD_ID]: {
          filename: 'test.pdf',
          fileType: 'application/pdf',
          progress: 0.5,
          status: 'in_progress',
          uploadId: MOCK_UPLOAD_ID,
        },
      };

      expect(userContentReducer(state, action)).toEqual(expectedState);
    });
  });
});
