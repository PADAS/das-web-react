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
  'device_status_properties': null,
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
  device_status_properties: null,
  'url': 'https://develop.pamdas.org/api/v1.0/subject/666420-bb2e-416e-a943-ef610eb1e04e'
},
];

export { mockSubjectsData };