import { generateOptionalStorageConfig } from '../reducers/storage-config';
import globallyResettableReducer from '../reducers/global-resettable';

const SET_MAP_POSITION = 'SET_MAP_POSITION';
export const MAP_POSITION_STORAGE_KEY = 'mapPosition';

const INITIAL_STATE = {
  bearing: 0,
  center: null,
  pitch: 0,
  zoom: null,
};

export const persistenceConfig = generateOptionalStorageConfig(MAP_POSITION_STORAGE_KEY, INITIAL_STATE);

export const setMapPosition = (payload) => ({
  type: SET_MAP_POSITION,
  payload,
});


const mapPositionReducer = (state = INITIAL_STATE, { type, payload }) => {
  if (type === SET_MAP_POSITION) return payload;
  return state;
};

export default globallyResettableReducer(mapPositionReducer, INITIAL_STATE);