import axios from 'axios';
import { API_URL } from "../constants";

// axios config
const axiosConfig = axios.create({
    BASE_URL: API_URL,
    Headers: {
        'Content-Type': 'application/json',
    }
});

// actions
const SEARCH_STRING = 'SEARCH_STRING';
const SEARCH_RESULTS = 'SEARCH_RESULTS';

// action creators
export const searchLocation = search => dispatch => {
       dispatch({
           type: SEARCH_STRING,
           payload: search
    });
}
export const fetchSearchResults = search => dispatch => {
    // `${API_URL}features?query=${search}`
    dispatch({
        type: SEARCH_RESULTS,
        // payload: res.data
    });
}

// initial state
const INITIAL_STATE = {
    search:'',
    results: []
};

// reducer
const searchLocationReducer = (state=INITIAL_STATE, action) => {
    const { type, payload } = action;

    if (type === SEARCH_STRING) {
        return { ...state, ...payload };
    }

    if (type === SEARCH_RESULTS) {
        return { ...state, results: payload };
    }
    return state;
}

export default searchLocationReducer;