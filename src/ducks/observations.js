

import axios from 'axios';
import { API_URL } from '../constants';

const { get } = axios;

export const OBSERVATIONS_API_URL = `${API_URL}observations`;
const FETCH_OBSERVATIONS_FOR_SUBJECT_SUCCESS = 'FETCH_OBSERVATIONS_FOR_SUBJECT_SUCCESS';

export const fetchObservationsForSubject = (params = {}) =>
  dispatch =>
    get(OBSERVATIONS_API_URL, { params: params })
      .then(({  data: { data } }) => {
        dispatch({
          type: FETCH_OBSERVATIONS_FOR_SUBJECT_SUCCESS,
          payload: data,
        });
        return {
          'count': 16,
          'next': null,
          'previous': null,
          'results': [
            {
              'id': '8b0d09d2-f665-4827-9089-4aa74ecbc675',
              'location': {
                'latitude': '20.63703369259081',
                'longitude': '-103.5837908746352'
              },
              'created_at': '2022-02-08T14:27:35.845995-08:00',
              'recorded_at': '2022-02-08T14:24:59-08:00',
              'source': '846be403-8385-4a80-8ff6-7bef43915c6e',
              'device_status_properties': [
                {
                  'label': 'speed',
                  'units': 'km',
                  'value': 20
                }
              ]
            },
            {
              'id': '7b175a2f-a032-4721-9477-976cd66422da',
              'location': {
                'latitude': '20.62697821490771',
                'longitude': '-103.65729318941618'
              },
              'created_at': '2022-02-10T10:49:08.036285-08:00',
              'recorded_at': '2022-02-10T10:47:40-08:00',
              'source': '846be403-8385-4a80-8ff6-7bef43915c6e',
              'device_status_properties': [
                {
                  'label': 'speed',
                  'units': 'km',
                  'value': 10
                }
              ]
            },
            {
              'id': 'e0e1d461-ad85-43f4-9058-f7100745f46e',
              'location': {
                'latitude': '20.65488288379814',
                'longitude': '-103.51164056378013'
              },
              'created_at': '2022-02-11T15:25:00.685281-08:00',
              'recorded_at': '2022-02-11T15:24:24-08:00',
              'source': '846be403-8385-4a80-8ff6-7bef43915c6e',
              'device_status_properties': [
                {
                  'label': 'speed',
                  'units': 'km',
                  'value': 100
                }
              ]
            },
            {
              'id': '696bb8d7-e04c-440a-9bb9-b51782822719',
              'location': {
                'latitude': '20.701132571473245',
                'longitude': '-103.57294108137883'
              },
              'created_at': '2022-02-12T07:22:20.486416-08:00',
              'recorded_at': '2022-02-12T07:22:05-08:00',
              'source': '846be403-8385-4a80-8ff6-7bef43915c6e',
              'device_status_properties': [
                {
                  'label': 'speed',
                  'units': 'km',
                  'value': 500
                },
                {
                  'label': 'temperature',
                  'units': 'c',
                  'value': 1000
                }
              ]
            },
            {
              'id': '8b0d09d2-f665-4827-9089-4aa74ddbc675',
              'location': {
                'latitude': '20.63703369259081',
                'longitude': '-103.5837908746352'
              },
              'created_at': '2022-02-18T14:27:35.845995-08:00',
              'recorded_at': '2022-02-18T14:24:59-08:00',
              'source': '846be403-8385-4a80-8ff6-7bef43915c6e',
              'device_status_properties': [
                {
                  'label': 'speed',
                  'units': 'km',
                  'value': 20
                }
              ]
            },
            {
              'id': '7b175a2f-a032-4721-9477-976cd66433da',
              'location': {
                'latitude': '20.62697821490771',
                'longitude': '-103.65729318941618'
              },
              'created_at': '2022-02-21T10:49:08.036285-08:00',
              'recorded_at': '2022-02-21T10:47:40-08:00',
              'source': '846be403-8385-4a80-8ff6-7bef43915c6e',
              'device_status_properties': [
                {
                  'label': 'speed',
                  'units': 'km',
                  'value': 10
                }
              ]
            },
            {
              'id': 'e0e1d461-ad85-43f4-9058-f7200745f46e',
              'location': {
                'latitude': '20.65488288379814',
                'longitude': '-103.51164056378013'
              },
              'created_at': '2022-02-21T15:25:00.685281-08:00',
              'recorded_at': '2022-02-21T15:24:24-08:00',
              'source': '846be403-8385-4a80-8ff6-7bef43915c6e',
              'device_status_properties': [
                {
                  'label': 'speed',
                  'units': 'km',
                  'value': 100
                }
              ]
            },
            {
              'id': '696bb8d7-e04c-440a-9bb9-b51782844755',
              'location': {
                'latitude': '20.701132571473245',
                'longitude': '-103.57294108137883'
              },
              'created_at': '2022-02-22T07:22:20.486416-08:00',
              'recorded_at': '2022-02-22T07:22:05-08:00',
              'source': '846be403-8385-4a80-8ff6-7bef43915c6e',
              'device_status_properties': [
                {
                  'label': 'speed',
                  'units': 'km',
                  'value': 500
                },
                {
                  'label': 'temperature',
                  'units': 'c',
                  'value': 1000
                }
              ]
            },
            {
              'id': '8b0d09d2-f665-4827-9089-4aa74w2et675',
              'location': {
                'latitude': '20.63703369259081',
                'longitude': '-103.5837908746352'
              },
              'created_at': '2022-02-23T14:27:35.845995-08:00',
              'recorded_at': '2022-02-23T14:24:59-08:00',
              'source': '846be403-8385-4a80-8ff6-7bef43915c6e',
              'device_status_properties': [
                {
                  'label': 'speed',
                  'units': 'km',
                  'value': 20
                }
              ]
            },
            {
              'id': '696bb8d7-e04c-440a-9bb9-b51782844719',
              'location': {
                'latitude': '20.701132571473245',
                'longitude': '-103.57294108137883'
              },
              'created_at': '2022-02-23T07:22:20.486416-08:00',
              'recorded_at': '2022-02-23T07:22:05-08:00',
              'source': '846be403-8385-4a80-8ff6-7bef43915c6e',
              'device_status_properties': [
                {
                  'label': 'speed',
                  'units': 'km',
                  'value': 500
                },
                {
                  'label': 'temperature',
                  'units': 'c',
                  'value': 1000
                },
                // {
                //   'label': 'color',
                //   'units': '',
                //   'value': 'red'
                // },
                // {
                //   'label': 'gate',
                //   'units': '',
                //   'value': 'open'
                // },
                // {
                //   'label': 'animals',
                //   'units': '',
                //   'value': 3
                // },
                // {
                //   'label': 'fruits',
                //   'units': '',
                //   'value': 3
                // },
                // {
                //   'label': 'weather',
                //   'units': 'c',
                //   'value': 20
                // },
                // {
                //   'label': 'gas',
                //   'units': 'lts',
                //   'value': 30
                // },
                // {
                //   'label': 'battery',
                //   'units': '%',
                //   'value': 30
                // },
                // {
                //   'label': 'water',
                //   'units': 'lts',
                //   'value': 20
                // }
              ]
            }
          ]
        };
      }
      );


const INITIAL_OBSERVATIONS_STATE = [];

const observationsReducer = (state = INITIAL_OBSERVATIONS_STATE, action = {}) => {
  if (action.type === FETCH_OBSERVATIONS_FOR_SUBJECT_SUCCESS) {
    return action.payload;
  }
  return state;
};

export default observationsReducer;