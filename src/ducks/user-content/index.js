import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { API_URL, API_V2_URL } from '../../constants';
import globallyResettableReducer from '../../reducers/global-resettable';

const COMMUNITY_API_URL = (communityValue) => `${API_V2_URL}community/${encodeURIComponent(communityValue)}/`;

export const COMMUNITY_COMPLETE_CHUNKED_UPLOAD_API_URL = (communityValue, uploadId) =>
  `${COMMUNITY_API_URL(communityValue)}usercontent/chunked-uploads/${uploadId}/complete/`;
export const COMMUNITY_INITIATE_CHUNKED_UPLOAD_API_URL = (communityValue) =>
  `${COMMUNITY_API_URL(communityValue)}usercontent/chunked-uploads/`;
export const COMMUNITY_UPLOAD_CHUNK_API_URL = (communityValue, uploadId, chunkIndex) =>
  `${COMMUNITY_API_URL(communityValue)}usercontent/chunked-uploads/${uploadId}/chunks/${chunkIndex}/`;
export const COMPLETE_CHUNKED_UPLOAD_API_URL = (uploadId) => `${API_URL}usercontent/chunked-uploads/${uploadId}/complete/`;
export const INITIATE_CHUNKED_UPLOAD_API_URL = `${API_URL}usercontent/chunked-uploads/`;
export const UPLOAD_CHUNK_API_URL = (uploadId, chunkIndex) => `${API_URL}usercontent/chunked-uploads/${uploadId}/chunks/${chunkIndex}/`;

export const ABORT_CONTROLLERS = new Map();
export const SUGGESTED_CHUNK_SIZE = 1024 * 1024; // 1 MiB
export const UPLOAD_FAILURE_REASONS = {
  TOO_LARGE: 'tooLarge',
  TOO_MANY_REQUESTS: 'tooManyRequests',
  UNKNOWN: 'unknown',
  UNSUPPORTED_TYPE: 'unsupportedType',
};

const UPLOAD_FAILURE_REASONS_BY_STATUS_CODE = {
  413: UPLOAD_FAILURE_REASONS.TOO_LARGE,
  415: UPLOAD_FAILURE_REASONS.UNSUPPORTED_TYPE,
  429: UPLOAD_FAILURE_REASONS.TOO_MANY_REQUESTS,
};

// Actions
export const CLEAR = 'USER_CONTENT.CLEAR';
export const REMOVE_UPLOAD = 'USER_CONTENT.REMOVE_UPLOAD';
export const SET_CHUNKED_UPLOAD_STATUS = 'USER_CONTENT.SET_CHUNKED_UPLOAD_STATUS';

// Action creators
export const clearUserContent = () => (dispatch, getState) => {
  ABORT_CONTROLLERS.forEach((controller) => controller.abort());
  ABORT_CONTROLLERS.clear();

  const userContent = getState().data.userContent ?? {};
  Object.values(userContent).forEach((upload) => {
    if (upload.objectUrl) {
      URL.revokeObjectURL(upload.objectUrl);
    }
  });

  dispatch({ type: CLEAR });
};

export const removeFile = (uploadId) => (dispatch, getState) => {
  ABORT_CONTROLLERS.get(uploadId)?.abort();
  ABORT_CONTROLLERS.delete(uploadId);

  const { objectUrl } = getState().data.userContent[uploadId] ?? {};
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }

  dispatch({ payload: { uploadId }, type: REMOVE_UPLOAD });
};

export const startChunkedUpload = async (file, uploadId, dispatch, communityInputValue = null) => {
  const abortController = ABORT_CONTROLLERS.get(uploadId);

  // A community visitor is anonymous and has no session to renew, so a 401 here
  // must skip the auth recovery that would otherwise sign them out mid-form.
  const requestConfig = {
    signal: abortController.signal,
    ...(communityInputValue ? { skipAuth: true } : {}),
  };

  const endpoints = communityInputValue
    ? {
      completeUrl: COMMUNITY_COMPLETE_CHUNKED_UPLOAD_API_URL(communityInputValue, uploadId),
      getChunkUrl: (chunkIndex) => COMMUNITY_UPLOAD_CHUNK_API_URL(communityInputValue, uploadId, chunkIndex),
      initiateUrl: COMMUNITY_INITIATE_CHUNKED_UPLOAD_API_URL(communityInputValue),
    }
    : {
      completeUrl: COMPLETE_CHUNKED_UPLOAD_API_URL(uploadId),
      getChunkUrl: (chunkIndex) => UPLOAD_CHUNK_API_URL(uploadId, chunkIndex),
      initiateUrl: INITIATE_CHUNKED_UPLOAD_API_URL,
    };

  try {
    const initiateChunkedUploadResponse = await axios.post(
      endpoints.initiateUrl,
      { chunk_size: SUGGESTED_CHUNK_SIZE, filename: file.name, id: uploadId, size: file.size },
      requestConfig
    );

    const { chunk_size: chunkSize, num_chunks: numChunks } = initiateChunkedUploadResponse.data.data;

    dispatch({ payload: { progress: 0, status: 'in_progress', uploadId }, type: SET_CHUNKED_UPLOAD_STATUS });

    for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
      const chunkOffset = chunkIndex * chunkSize;
      const chunk = file.slice(chunkOffset, chunkOffset + chunkSize);

      await axios.put(
        endpoints.getChunkUrl(chunkIndex),
        chunk,
        { headers: { 'Content-Type': 'application/octet-stream' }, ...requestConfig }
      );

      dispatch({
        payload: { progress: (chunkIndex + 1) / numChunks, status: 'in_progress', uploadId },
        type: SET_CHUNKED_UPLOAD_STATUS,
      });
    }

    await axios.post(endpoints.completeUrl, {}, requestConfig);

    dispatch({ payload: { progress: 1, status: 'complete', uploadId }, type: SET_CHUNKED_UPLOAD_STATUS });
  } catch (error) {
    if (!abortController.signal.aborted) {
      // The DAS envelope carries the real code when the HTTP status is a generic
      // one. utils/request.js resolves the pair the same way.
      const statusCode = error?.response?.data?.status?.code ?? error?.response?.status;

      dispatch({
        payload: {
          reason: UPLOAD_FAILURE_REASONS_BY_STATUS_CODE[statusCode] ?? UPLOAD_FAILURE_REASONS.UNKNOWN,
          status: 'failed',
          uploadId,
        },
        type: SET_CHUNKED_UPLOAD_STATUS,
      });
    }
  } finally {
    ABORT_CONTROLLERS.delete(uploadId);
  }
};

export const uploadFile = (file, communityInputValue = null) => (dispatch) => {
  const uploadId = uuidv4();

  dispatch({
    payload: {
      filename: file.name,
      fileType: file.type,
      objectUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: null,
      status: 'in_progress',
      uploadId,
    },
    type: SET_CHUNKED_UPLOAD_STATUS,
  });

  const abortController = new AbortController();
  ABORT_CONTROLLERS.set(uploadId, abortController);

  startChunkedUpload(file, uploadId, dispatch, communityInputValue);

  return uploadId;
};

// Reducer
export const INITIAL_STATE = {};

const userContentReducer = (state, action) => {
  switch (action.type) {
  case CLEAR:
    return INITIAL_STATE;

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
