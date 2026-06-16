import axios from 'axios';

import { API_URL } from '../../constants';
import globallyResettableReducer from '../../reducers/global-resettable';

export const COMPLETE_CHUNKED_UPLOAD_API_URL = (uploadId) => `${API_URL}usercontent/chunked-uploads/${uploadId}/complete/`;
export const INITIATE_CHUNKED_UPLOAD_API_URL = `${API_URL}usercontent/chunked-uploads/`;
export const UPLOAD_CHUNK_API_URL = (uploadId, chunkIndex) => `${API_URL}usercontent/chunked-uploads/${uploadId}/chunks/${chunkIndex}/`;

// Actions
export const CHUNKED_UPLOAD_COMPLETED = 'USER_CONTENT.CHUNKED_UPLOAD_COMPLETED';
export const CHUNKED_UPLOAD_FAILED = 'USER_CONTENT.CHUNKED_UPLOAD_FAILED';
export const CHUNKED_UPLOAD_PROGRESSED = 'USER_CONTENT.CHUNKED_UPLOAD_PROGRESSED';
export const CHUNKED_UPLOAD_STARTED = 'USER_CONTENT.CHUNKED_UPLOAD_STARTED';

// Action creators
const startChunkedUpload = async (file, uploadId, controllerSignal, dispatch) => {
  // Slice the file into chunks and PUT each chunk to UPLOAD_CHUNK_API_URL, dispatching
  // CHUNKED_UPLOAD_PROGRESSED after each one. Pass `controllerSignal` to all axios calls.
  // POST to COMPLETE_CHUNKED_UPLOAD_API_URL when all chunks are done.
  // Dispatch CHUNKED_UPLOAD_COMPLETED on success, CHUNKED_UPLOAD_FAILED on error.
};

export const uploadFile = (file, controllerSignal) => async (dispatch) => {
  // POST to INITIATE_CHUNKED_UPLOAD_API_URL to get the server-assigned uploadId.
  // const { data: { upload_id: uploadId } } = await axios.post(INITIATE_CHUNKED_UPLOAD_API_URL, { filename: file.name }, { signal });
  const uploadId = 'uploadId'; // Placeholder — real ID comes from INITIATE_CHUNKED_UPLOAD_API_URL.

  dispatch({ type: CHUNKED_UPLOAD_STARTED, payload: { uploadId } });

  // Run asynchronously — do not await.
  startChunkedUpload(file, uploadId, controllerSignal, dispatch);

  return uploadId;
};

// Reducer
export const INITIAL_STATE = {};

const userContentReducer = (state, action) => {
  switch (action.type) {
  case CHUNKED_UPLOAD_COMPLETED:
    return { ...state, [action.payload.uploadId]: { status: 'complete', progress: 1 } };

  case CHUNKED_UPLOAD_FAILED:
    return { ...state, [action.payload.uploadId]: { status: 'failed', progress: 0 } };

  case CHUNKED_UPLOAD_PROGRESSED:
    return { ...state, [action.payload.uploadId]: { status: 'in_progress', progress: action.payload.progress } };

  case CHUNKED_UPLOAD_STARTED:
    return { ...state, [action.payload.uploadId]: { status: 'pending', progress: 0 } };

  default:
    return state;
  }
};

export default globallyResettableReducer(userContentReducer, INITIAL_STATE);
