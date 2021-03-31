import axios from 'axios';

import { API_URL } from '../constants';
import globallyResettableReducer from '../reducers/global-resettable';


const PATROL_TRACKEDBY_SCHEMA_API_URL = `${API_URL}activity/patrols/trackedby`;
const FETCH_PATROL_TRACKEDBY_SCHEMA_SUCCESS = 'FETCH_PATROL_TRACKEDBY_SCHEMA_SUCCESS';


const { get } = axios;

export const fetchTrackedBySchema = () => dispatch => get(PATROL_TRACKEDBY_SCHEMA_API_URL)
    .then(({ data: { data } }) => {
        console.log("dispatch.....", data);
        dispatch(fetchTrackedBySuccess(data));

    });

const fetchTrackedBySuccess = payload => ({
    type: FETCH_PATROL_TRACKEDBY_SCHEMA_SUCCESS,
    payload,
});


const patrolTrackedBySchemaReducer = (state, action) => {
    const { type, payload } = action;



    if (type === FETCH_PATROL_TRACKEDBY_SCHEMA_SUCCESS) {

        return { ...state, trackedbySchema: payload };
    };
    return state;
}


export default globallyResettableReducer(patrolTrackedBySchemaReducer, {});