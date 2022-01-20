const mockSubjectsData = [{
  'content_type': 'observations.subject',
  'id': '0f36c930-bb2e-416e-a943-ef610eb1e04e',
  'name': 'Jes Pixel',
  'subject_type': 'wildlife',
  'subject_subtype': 'dugong',
  'common_name': null,
  'additional': {
    'rgb': '',
    'sex': 'male',
    'region': '',
    'country': '',
    'tm_animal_id': ''
  },
  'created_at': '2020-08-13T14:17:45.198599-07:00',
  'updated_at': '2020-09-29T13:16:18.614136-07:00',
  'is_active': true,
  'region': '',
  'country': '',
  'sex': 'male',
  'tracks_available': true,
  'image_url': '/static/dugong-male.svg',
  'last_position_status': {
    'last_voice_call_start_at': null,
    'radio_state_at': '2020-10-04T11:24:42+00:00',
    'radio_state': 'roam app state'
  },
  'last_position_date': '2020-10-04T11:24:41+00:00',
  'last_position': {
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [
        -122.38420717,
        47.52167737
      ]
    },
    'properties': {
      'title': 'Jes Pixel',
      'subject_type': 'wildlife',
      'subject_subtype': 'dugong',
      'id': '0f36c930-bb2e-416e-a943-ef610eb1e04e',
      'stroke': '',
      'stroke-opacity': 1,
      'stroke-width': 2,
      'image': 'https://develop.pamdas.org/static/dugong-male.svg',
      'last_voice_call_start_at': null,
      'location_requested_at': null,
      'radio_state_at': '2020-10-04T11:24:42+00:00',
      'radio_state': 'roam app state',
      'coordinateProperties': {
        'time': '2020-10-04T11:24:41+00:00'
      },
      'DateTime': '2020-10-04T11:24:41+00:00'
    }
  },
  'url': 'https://develop.pamdas.org/api/v1.0/subject/0f36c930-bb2e-416e-a943-ef610eb1e04e'
},
{
  'content_type': 'observations.subject',
  'id': '666420-bb2e-416e-a943-ef610eb1e04e',
  'name': 'Static ol\' Joshua',
  'subject_type': 'person',
  'subject_subtype': 'ranger',
  'common_name': null,
  'additional': {
    'rgb': '',
    'sex': 'male',
    'region': '',
    'country': '',
  },
  'created_at': '2020-08-13T14:17:45.198599-07:00',
  'updated_at': '2020-09-29T13:16:18.614136-07:00',
  'is_active': true,
  'region': '',
  'country': '',
  'sex': 'male',
  'tracks_available': false,
  'image_url': '/static/dugong-female.svg',
  'last_position_status': null,
  'last_position_date': null,
  'last_position': null,
  'static_position': [0, 1],
  'url': 'https://develop.pamdas.org/api/v1.0/subject/666420-bb2e-416e-a943-ef610eb1e04e'
},
];

export const subjectFeatureWithMultipleDeviceProps = { 'type': 'Feature', 'properties': { 'content_type': 'observations.subject', 'id': '172df632-3fd4-4e5d-8366-925b92fcf025', 'name': 'RD-001', 'subject_type': 'person', 'subject_subtype': 'ranger', 'common_name': null, 'additional': {}, 'created_at': '2021-02-16T01:04:26.664799-08:00', 'updated_at': '2021-02-16T01:04:26.664833-08:00', 'is_active': true, 'tracks_available': true, 'image_url': '/static/ranger-gray.svg', 'last_position_status': { 'last_voice_call_start_at': '2021-02-16T09:03:55+00:00', 'radio_state_at': '2021-02-16T09:04:25+00:00', 'radio_state': 'offline' }, 'last_position_date': '2021-01-27T09:04:25+00:00', 'device_status_properties': [{ 'label': 'Favorite Color', 'units': '', 'value': 'DarkBlue' }, { 'label': 'Model No.', 'units': '', 'value': 'Gidr1000' }, { 'label': '', 'units': '', 'value': 'C' }], 'url': 'https://develop.pamdas.org/api/v1.0/subject/172df632-3fd4-4e5d-8366-925b92fcf025', 'title': 'RD-001', 'stroke': '#FFFF00', 'stroke-opacity': 1, 'stroke-width': 2, 'image': 'https://develop.pamdas.org/static/ranger-gray.svg', 'last_voice_call_start_at': '2021-02-16T09:03:55+00:00', 'location_requested_at': null, 'radio_state_at': '2021-02-16T09:04:25+00:00', 'radio_state': 'offline', 'coordinateProperties': { 'time': '2021-01-27T09:04:25+00:00' }, 'DateTime': '2021-01-27T09:04:25+00:00', 'ticker': '' }, 'geometry': { 'type': 'Point', 'coordinates': [37.37617, 0.22316] } };
export const subjectFeatureWithOneDeviceProp =  { 'type': 'Feature', 'properties': { 'content_type': 'observations.subject', 'id': '172df632-3fd4-4e5d-8366-925b92fcf025', 'name': 'RD-001', 'subject_type': 'person', 'subject_subtype': 'stranger_danger', 'common_name': null, 'additional': {}, 'created_at': '2021-05-01T01:04:26.664799-08:00', 'updated_at': '2021-02-16T01:04:26.664833-08:00', 'is_active': true, 'tracks_available': true, 'image_url': '/static/ranger-green.svg', 'last_position_status': null, 'last_position_date': '2021-01-27T09:04:25+00:00', 'device_status_properties': [{ 'label': 'How many?', 'units': 'only', 'value': '1' }, { 'label': 'Boolean value', 'units': '', 'value': false }], 'url': 'https://develop.pamdas.org/api/v1.0/subject/666-666-666-666', 'title': 'RD-666', 'stroke': '#F0F0F0', 'stroke-opacity': 1, 'stroke-width': 1, 'image': 'https://develop.pamdas.org/static/ranger-green.svg', 'last_voice_call_start_at': '2021-02-16T09:03:55+00:00', 'location_requested_at': null, 'radio_state_at': '2021-02-16T09:04:25+00:00', 'radio_state': 'offline', 'coordinateProperties': { 'time': '2021-01-27T09:04:25+00:00' }, 'DateTime': '2021-01-27T09:04:25+00:00', 'ticker': '' }, 'geometry': { 'type': 'Point', 'coordinates': [37.37617, 0.22316] } };
export const subjectFeatureWithoutDeviceProps =  { 'type': 'Feature', 'properties': { 'content_type': 'observations.subject', 'id': '199d69c2-795f-404c-9af5-7289d675cbd3', 'name': 'Radio No. 1', 'subject_type': 'person', 'subject_subtype': 'ranger', 'common_name': null, 'additional': { 'rgb': '110,158,172', 'sex': 'male', 'region': '', 'country': '', 'tm_animal_id': '' }, 'created_at': '2020-03-29T15:11:56.940453-07:00', 'updated_at': '2020-05-01T10:35:25.148108-07:00', 'is_active': true, 'region': '', 'country': '', 'sex': 'male', 'tracks_available': true, 'image_url': '/static/ranger-blue.svg', 'last_position_status': { 'last_voice_call_start_at': '2020-06-24T15:15:33+00:00', 'radio_state_at': '2020-06-24T15:20:54+00:00', 'radio_state': 'online' }, 'last_position_date': '2020-11-12T17:21:05+00:00', 'device_status_properties': null, 'url': 'https://develop.pamdas.org/api/v1.0/subject/199d69c2-795f-404c-9af5-7289d675cbd3', 'title': 'Radio No. 1', 'stroke': '#6E9EAC', 'stroke-opacity': 1, 'stroke-width': 2, 'image': 'https://develop.pamdas.org/static/ranger-blue.svg', 'last_voice_call_start_at': '2020-06-24T15:15:33+00:00', 'location_requested_at': null, 'radio_state_at': '2020-06-24T15:20:54+00:00', 'radio_state': 'online', 'coordinateProperties': { 'time': '2020-11-12T17:21:05+00:00' }, 'DateTime': '2020-11-12T17:21:05+00:00', 'ticker': '' }, 'geometry': { 'type': 'Point', 'coordinates': [-3.319247817157387, 37.38961074832439] } };
export const staticSubjectFeature = { 'type': 'Feature', 'properties': { 'content_type': 'observations.subject', 'id': '02e13e18-47cb-4e03-9af2-3dc0e1401AAA', 'name': 'Static Sensor Feature', 'subject_type': 'static_sensor', 'subject_subtype': 'weather_station', 'common_name': null, 'additional': {}, 'created_at': '2021-10-26T13:42:53.969203-07:00', 'updated_at': '2021-10-26T13:42:53.969222-07:00', 'is_active': true, 'tracks_available': false, 'image_url': 'https://develop.pamdas.org/static/ranger-gray.svg', 'last_position_status': { 'last_voice_call_start_at': null, 'radio_state_at': '2021-10-26T20:42:53+00:00', 'radio_state': 'roam app state' }, 'last_position_date': '2021-10-26T20:42:53+00:00', 'device_status_properties': [ { 'default': true, 'label': 'Temperature', 'units': 'ºC', 'value': '31' }, { 'label': 'Wind', 'units': 'kph', 'value': '12' }, { 'label': 'Humidity', 'units': '%', 'value': '75' } ], 'url': 'https://develop.pamdas.org/api/v1.0/subject/02e13e18-47cb-4e03-9af2-3dc0e1401dde', 'title': 'Patsy Weather station', 'stroke': '#FFFF00', 'stroke-opacity': 1, 'stroke-width': 2, 'image': 'https://develop.pamdas.org/static/ranger-gray.svg', 'last_voice_call_start_at': null, 'location_requested_at': null, 'radio_state_at': '2021-10-26T20:42:53+00:00', 'radio_state': 'roam app state', 'coordinateProperties': { 'time': '2021-11-08T20:09:06+00:00' }, 'DateTime': '2021-10-26T20:42:53+00:00', 'ticker': '', 'is_static': true }, 'geometry': { 'type': 'Point', 'coordinates': [ -103.5063008384256, 20.65075187788682 ] } };
export const staticSubjectFeatureWithoutIcon = { 'type': 'Feature', 'properties': { 'content_type': 'observations.subject', 'id': '02e13e18-47cb-4e03-9af2-3dc0e1401CCC', 'name': 'No icon Feature', 'subject_type': 'static_sensor', 'subject_subtype': 'weather_station', 'common_name': null, 'additional': {}, 'created_at': '2021-10-26T13:42:53.969203-08:00', 'updated_at': '2021-10-26T13:42:53.969222-08:00', 'is_active': true, 'tracks_available': false, 'image_url': null, 'last_position_status': { 'last_voice_call_start_at': null, 'radio_state_at': '2021-10-26T20:42:53+00:00', 'radio_state': 'roam app state' }, 'last_position_date': '2021-10-26T20:42:53+00:00', 'device_status_properties': [ { 'default': true, 'label': 'Temperature', 'units': 'ºC', 'value': '25' }, { 'label': 'Wind', 'units': 'kph', 'value': '12' }, { 'label': 'Humidity', 'units': '%', 'value': '75' } ], 'url': 'https://develop.pamdas.org/api/v1.0/subject/02e13e18-47cb-4e03-9af2-3dc0e1401dde', 'title': 'Second Weather station', 'stroke': '#FFFF00', 'stroke-opacity': 1, 'stroke-width': 2, 'image': null, 'last_voice_call_start_at': null, 'location_requested_at': null, 'radio_state_at': '2021-10-26T20:42:53+00:00', 'radio_state': 'roam app state', 'coordinateProperties': { 'time': '2021-11-08T20:09:06+00:00' }, 'DateTime': '2021-10-26T20:42:53+00:00', 'ticker': '', 'is_static': true }, 'geometry': { 'type': 'Point', 'coordinates': [ -103.591416, 20.629804 ] } };
export const staticSubjectFeatureWithoutDefaultValue = { 'type': 'Feature', 'properties': { 'content_type': 'observations.subject', 'id': '02e13e18-47cb-4e03-9af2-3dc0e1401EEE', 'name': 'Only Icon feature', 'subject_type': 'static_sensor', 'subject_subtype': 'weather_station', 'common_name': null, 'additional': {}, 'created_at': '2021-10-26T13:42:53.969203-08:00', 'updated_at': '2021-10-26T13:42:53.969222-08:00', 'is_active': true, 'tracks_available': false, 'image_url': 'https://develop.pamdas.org/static/ranger-blue.svg', 'last_position_status': { 'last_voice_call_start_at': null, 'radio_state_at': '2021-10-26T20:42:53+00:00', 'radio_state': 'roam app state' }, 'last_position_date': '2021-10-26T20:42:53+00:00', 'device_status_properties': [ { 'label': 'Temperature', 'units': 'ºC', 'value': '25' }, { 'label': 'Wind', 'units': 'kph', 'value': '12' }, { 'label': 'Door', 'units': '', 'value': 'Locked' } ], 'url': 'https://develop.pamdas.org/api/v1.0/subject/02e13e18-47cb-4e03-9af2-3dc0e1401dde', 'title': 'Second Weather station', 'stroke': '#FFFF00', 'stroke-opacity': 1, 'stroke-width': 2, 'image': 'https://develop.pamdas.org/static/ranger-blue.svg', 'last_voice_call_start_at': null, 'location_requested_at': null, 'radio_state_at': '2021-10-26T20:42:53+00:00', 'radio_state': 'roam app state', 'coordinateProperties': { 'time': '2021-11-08T20:09:06+00:00' }, 'DateTime': '2021-10-26T20:42:53+00:00', 'ticker': '', 'is_static': true }, 'geometry': { 'type': 'Point', 'coordinates': [ -103.578507, 20.705038 ] } };


export const mockMapSubjectFeatureCollection = {
  'type': 'FeatureCollection',
  'features': [
    subjectFeatureWithMultipleDeviceProps,
    subjectFeatureWithOneDeviceProp,
    subjectFeatureWithoutDeviceProps,
  ] };

export const mockMapStaticSubjectFeatureCollection = {
  'type': 'FeatureCollection',
  'features': [
    staticSubjectFeature,
    staticSubjectFeatureWithoutIcon,
    staticSubjectFeatureWithoutDefaultValue
  ] };

export default mockSubjectsData;
