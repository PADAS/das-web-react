import axios from 'axios';
import { API_URL } from "../constants";
import globallyResettableReducer from '../reducers/global-resettable';

// axios config
const axiosConfig = axios.create({
    BASE_URL: API_URL,
    Headers: {
        'Content-Type': 'application/json',
    }
});

// initial state
const INITIAL_STATE = '';

// actions
const SEARCH_STRING = 'SEARCH_STRING';
const SEARCH_RESULTS = 'SEARCH_RESULTS';

// action creators
export const searchLocation = (search) => dispatch => {
    dispatch({
        type: SEARCH_STRING,
        payload: search
    });
};

export const fetchSearchResults = (search) => dispatch => {
    dispatch({
        type: SEARCH_RESULTS,
    });
}
// reducer
export const searchLocationReducer = (state=INITIAL_STATE, action) => {
    const { type, payload } = action;

    if (type === SEARCH_STRING) {
        return [...state, payload]
    }

    if (type === SEARCH_RESULTS) {
        return payload;
    }
    return state;
}

export default globallyResettableReducer(searchLocationReducer, INITIAL_STATE);