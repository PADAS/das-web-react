import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { API_URL } from '../../constants';
import globallyResettableReducer from '../../reducers/global-resettable';

export const COMPLETE_CHUNKED_UPLOAD_API_URL = (uploadId) => `${API_URL}usercontent/chunked-uploads/${uploadId}/complete/`;
export const INITIATE_CHUNKED_UPLOAD_API_URL = `${API_URL}usercontent/chunked-uploads/`;
export const UPLOAD_CHUNK_API_URL = (uploadId, chunkIndex) => `${API_URL}usercontent/chunked-uploads/${uploadId}/chunks/${chunkIndex}/`;

export const ABORT_CONTROLLERS = new Map();
export const SUGGESTED_CHUNK_SIZE = 1024 * 1024; // 1 MiB

// Actions
export const REMOVE_UPLOAD = 'USER_CONTENT.REMOVE_UPLOAD';
export const SET_CHUNKED_UPLOAD_STATUS = 'USER_CONTENT.SET_CHUNKED_UPLOAD_STATUS';

// Action creators
export const removeFile = (uploadId) => (dispatch, getState) => {
  ABORT_CONTROLLERS.get(uploadId)?.abort();
  ABORT_CONTROLLERS.delete(uploadId);

  const { objectUrl } = getState().data.userContent[uploadId] ?? {};
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }

  dispatch({ payload: { uploadId }, type: REMOVE_UPLOAD });
};

export const startChunkedUpload = async (file, uploadId, dispatch) => {
  const abortController = ABORT_CONTROLLERS.get(uploadId);

  try {
    const initiateChunkedUploadResponse = await axios.post(
      INITIATE_CHUNKED_UPLOAD_API_URL,
      { chunk_size: SUGGESTED_CHUNK_SIZE, filename: file.name, id: uploadId, size: file.size },
      { signal: abortController.signal }
    );

    const { chunk_size: chunkSize, num_chunks: numChunks } = initiateChunkedUploadResponse.data.data;

    dispatch({ payload: { progress: 0, status: 'uploading', uploadId }, type: SET_CHUNKED_UPLOAD_STATUS });

    for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
      const chunkOffset = chunkIndex * chunkSize;
      const chunk = file.slice(chunkOffset, chunkOffset + chunkSize);

      await axios.put(
        UPLOAD_CHUNK_API_URL(uploadId, chunkIndex),
        chunk,
        { headers: { 'Content-Type': 'application/octet-stream' }, signal: abortController.signal }
      );

      dispatch({
        payload: { progress: (chunkIndex + 1) / numChunks, status: 'uploading', uploadId },
        type: SET_CHUNKED_UPLOAD_STATUS,
      });
    }

    await axios.post(COMPLETE_CHUNKED_UPLOAD_API_URL(uploadId), {}, { signal: abortController.signal });

    dispatch({ payload: { progress: 1, status: 'completed', uploadId }, type: SET_CHUNKED_UPLOAD_STATUS });
  } catch {
    if (!abortController.signal.aborted) {
      dispatch({ payload: { status: 'failed', uploadId }, type: SET_CHUNKED_UPLOAD_STATUS });
    }
  } finally {
    ABORT_CONTROLLERS.delete(uploadId);
  }
};

export const uploadFile = (file) => (dispatch) => {
  const uploadId = uuidv4();

  dispatch({
    payload: {
      filename: file.name,
      fileType: file.type,
      objectUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'pending',
      uploadId,
    },
    type: SET_CHUNKED_UPLOAD_STATUS,
  });

  const abortController = new AbortController();
  ABORT_CONTROLLERS.set(uploadId, abortController);

  startChunkedUpload(file, uploadId, dispatch);

  return uploadId;
};

// Reducer
export const INITIAL_STATE = {};

const userContentReducer = (state, action) => {
  switch (action.type) {
  case REMOVE_UPLOAD: {
    const { [action.payload.uploadId]: _, ...rest } = state;

    return rest;
  }

  case SET_CHUNKED_UPLOAD_STATUS:
    return {
      ...state,
      [action.payload.uploadId]: {
        ...state[action.payload.uploadId],
        ...action.payload,
      },
    };

  default:
    return state;
  }
};

export default globallyResettableReducer(userContentReducer, INITIAL_STATE);
