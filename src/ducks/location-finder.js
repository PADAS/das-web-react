// import axios from 'axios';

// const SEARCH_URL = `https://api.mapbox.com/geocoding/v5/mapbox.places/`

// // actions
// const SEARCH_LOCATION = 'SEARCH_LOCATION';
// const FETCH_LOCATION = 'FETCH_LOCATION';

// // action creators
// export const searchLocation = search => dispatch => {
//        dispatch({
//            type: SEARCH_LOCATION,
//            payload: search
//     });
// }
// export const fetchLocations = search => dispatch => {
//     axios
//     // .get(`${SEARCH_URL}${search}.json?access_token=REACT_APP_MAPBOX_TOKEN`)
//     .then(res => 
//         dispatch({
//             type: FETCH_LOCATION,
//             payload: {
//                 'coords': res.features.geometry.coordinates,
//                 'place': res.features.place_name
//             }
//         })
//     )
//     .catch(err => console.log(err));
// }

// // initial state
// const INITIAL_STATE = {
//     search:'',
//     results: [],
//     loading: false,
//     result: []
// };

// // reducer
// const searchLocationReducer = (state=INITIAL_STATE, action) => {
//     const { type, payload } = action;

//     if (type === SEARCH_LOCATION) {
//         return { ...state, ...payload };
//     }

//     if (type === FETCH_LOCATION) {
//         return {...state, ...payload };
//     }
//     return state;
// }

// export default searchLocationReducer;