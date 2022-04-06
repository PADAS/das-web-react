import { TAB_KEYS } from '../../constants';

const patrols = [
  {
    'id': '91970025-c4dc-4680-822d-21a686595985',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1298,
    'title': 'Test Schedule Patrol',
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': '76794b2f-cbb2-49ed-b0dd-9335ae471562',
        'patrol_type': 'routine_patrol',
        'leader': null,
        'scheduled_start': '2021-08-13T16:24:00-07:00',
        'scheduled_end': null,
        'time_range': {
          'start_time': null,
          'end_time': null
        },
        'start_location': null,
        'end_location': null,
        'events': [],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/routine-patrol-icon.svg',
        'icon_id': 'routine-patrol-icon',
        'updates': []
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-08-10T23:24:52.962444+00:00',
        'user': {
          'username': 'tiffanyw',
          'first_name': 'Tiffany',
          'last_name': 'Wong',
          'id': '7d5a78bd-ebfa-4424-880b-d2969101b610',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': '8d1ce690-b2a7-4cda-a65b-bbe9a677e663',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1455,
    'title': null,
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': '1cda8da8-6ee9-4e92-bbd8-090bba07b54b',
        'patrol_type': 'dog_patrol',
        'leader': {
          'content_type': 'observations.subject',
          'id': '44b437e9-8ab1-4cbf-8b64-e549d94a4f08',
          'name': '6p-test',
          'subject_type': 'aircraft',
          'subject_subtype': 'helicopter',
          'common_name': null,
          'additional': {
            'rgb': '',
            'sex': 'male',
            'region': '',
            'country': '',
            'tm_animal_id': ''
          },
          'created_at': '2020-08-31T21:57:48.963833-07:00',
          'updated_at': '2021-09-20T07:51:05.723198-07:00',
          'is_active': true,
          'region': '',
          'country': '',
          'sex': 'male',
          'tracks_available': false,
          'image_url': '/static/helicopter-black.svg'
        },
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-11-01T11:50:00.724000-07:00',
          'end_time': null
        },
        'start_location': {
          'latitude': 0.22551949687290573,
          'longitude': 37.47265693960756
        },
        'end_location': null,
        'events': [],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/dog-patrol-icon.svg',
        'icon_id': 'dog-patrol-icon',
        'updates': []
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-11-01T18:50:09.346419+00:00',
        'user': {
          'username': 'luisd',
          'first_name': 'Luis',
          'last_name': 'Diaz',
          'id': '613493c8-9d23-42d9-a6ad-6861d1306f38',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': 'aa392a93-af31-4749-a486-1d2338f68f65',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1385,
    'title': null,
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': '9910bb41-eb5e-4723-b1b0-2cc132064c84',
        'patrol_type': 'routine_patrol',
        'leader': {
          'content_type': 'observations.subject',
          'id': 'dba0e0a6-0083-41be-a0eb-99e956977748',
          'name': 'Alex',
          'subject_type': 'person',
          'subject_subtype': 'ranger',
          'common_name': null,
          'additional': {},
          'created_at': '2021-08-31T14:42:06.701541-07:00',
          'updated_at': '2021-08-31T14:42:06.701557-07:00',
          'is_active': true,
          'tracks_available': false,
          'image_url': '/static/ranger-black.svg'
        },
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-09-30T15:24:52.182000-07:00',
          'end_time': null
        },
        'start_location': null,
        'end_location': null,
        'events': [
          {
            'id': '459cedf6-4d26-4a6d-a0df-1e52b6528eca',
            'serial_number': 155027,
            'event_type': 'wildlife_sighting_rep',
            'priority': 0,
            'title': null,
            'state': 'new',
            'contains': [],
            'updated_at': '2021-09-30T15:42:30.014985-07:00',
            'is_collection': false
          },
          {
            'id': '973c00a7-2137-410c-8675-801ff0e63029',
            'serial_number': 155884,
            'event_type': 'immobility',
            'priority': 300,
            'title': 'black view test  is immobile',
            'state': 'resolved',
            'contains': [],
            'updated_at': '2021-10-21T08:03:24.440848-07:00',
            'geojson': {
              'type': 'Feature',
              'geometry': {
                'type': 'Point',
                'coordinates': [
                  -99.10683873015874,
                  19.48997444444445
                ]
              },
              'properties': {
                'message': '',
                'datetime': '2021-10-20T14:59:12.871122+00:00',
                'image': 'https://develop.pamdas.org/static/immobility-lt_gray.svg',
                'icon': {
                  'iconUrl': 'https://develop.pamdas.org/static/immobility-lt_gray.svg',
                  'iconSize': [
                    25,
                    25
                  ],
                  'iconAncor': [
                    12,
                    12
                  ],
                  'popupAncor': [
                    0,
                    -13
                  ],
                  'className': 'dot'
                }
              }
            },
            'is_collection': false
          }
        ],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/routine-patrol-icon.svg',
        'icon_id': 'routine-patrol-icon',
        'updates': [
          {
            'message': 'Report Added',
            'time': '2021-10-20T14:59:12.880520+00:00',
            'user': {
              'content_type': null
            },
            'type': 'add_event'
          },
          {
            'message': 'Updated fields: Tracking Subject',
            'time': '2021-09-30T22:42:38.640591+00:00',
            'user': {
              'username': 'yazzm',
              'first_name': 'Yazz',
              'last_name': '',
              'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
              'content_type': 'accounts.user'
            },
            'type': 'update_segment'
          },
          {
            'message': 'Report Added',
            'time': '2021-09-30T22:42:30.020771+00:00',
            'user': {
              'username': 'yazzm',
              'first_name': 'Yazz',
              'last_name': '',
              'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
              'content_type': 'accounts.user'
            },
            'type': 'add_event'
          }
        ]
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-09-30T22:24:54.022287+00:00',
        'user': {
          'username': 'yazzm',
          'first_name': 'Yazz',
          'last_name': '',
          'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': 'c6a559ea-c2f8-4439-a00c-94c629cb4dee',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1429,
    'title': 'API_test',
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': '94de37ff-f03c-4c4d-9d66-f6ed7bf74a6f',
        'patrol_type': 'routine_patrol',
        'leader': null,
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-09-29T10:48:30.525000-07:00',
          'end_time': null
        },
        'start_location': null,
        'end_location': null,
        'events': [],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/routine-patrol-icon.svg',
        'icon_id': 'routine-patrol-icon',
        'updates': []
      }
    ],
    'updates': [
      {
        'message': 'Updated fields: State is open',
        'time': '2021-10-11T00:47:23.605456+00:00',
        'user': {
          'username': 'yazzm',
          'first_name': 'Yazz',
          'last_name': '',
          'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
          'content_type': 'accounts.user'
        },
        'type': 'update_patrol_state'
      },
      {
        'message': 'Updated fields: Title',
        'time': '2021-10-11T00:43:22.302741+00:00',
        'user': {
          'username': 'yazzm',
          'first_name': 'Yazz',
          'last_name': '',
          'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
          'content_type': 'accounts.user'
        },
        'type': 'update_patrol'
      },
      {
        'message': 'Updated fields: State is cancelled',
        'time': '2021-10-11T00:43:21.680880+00:00',
        'user': {
          'username': 'yazzm',
          'first_name': 'Yazz',
          'last_name': '',
          'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
          'content_type': 'accounts.user'
        },
        'type': 'update_patrol_state'
      },
      {
        'message': 'Patrol Added',
        'time': '2021-10-11T00:43:08.228785+00:00',
        'user': {
          'username': 'yazzm',
          'first_name': 'Yazz',
          'last_name': '',
          'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': '4ede7375-16d6-43f2-b216-1627249a2876',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1425,
    'title': 'AutoTest',
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': 'f46b4798-9978-43b9-b818-720880f38758',
        'patrol_type': 'routine_patrol',
        'leader': null,
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-09-29T10:48:30.525000-07:00',
          'end_time': null
        },
        'start_location': null,
        'end_location': null,
        'events': [],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/routine-patrol-icon.svg',
        'icon_id': 'routine-patrol-icon',
        'updates': []
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-10-07T19:46:26.551099+00:00',
        'user': {
          'username': 'auto_apiTesting',
          'first_name': 'automation',
          'last_name': 'testing',
          'id': '0114c097-07cc-4620-8ff2-226f359790d4',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': 'f6e6c1d9-2b10-4e78-ba75-c14fdcfc15b9',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1379,
    'title': null,
    'files': [],
    'notes': [
      {
        'id': 'd132b883-25c1-416f-b7cc-ddd2b3809776',
        'text': 'Dori',
        'updates': [
          {
            'message': 'Note Added',
            'time': '2021-10-06T00:39:35.986902+00:00',
            'text': 'Dori',
            'user': {
              'username': 'yazzm',
              'first_name': 'Yazz',
              'last_name': '',
              'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
              'content_type': 'accounts.user'
            },
            'type': 'add_patrolnote'
          }
        ]
      }
    ],
    'patrol_segments': [
      {
        'id': 'a435739d-ff1f-49af-87e2-ebb8135ce800',
        'patrol_type': 'routine_patrol',
        'leader': {
          'content_type': 'observations.subject',
          'id': 'bd062d57-ebf4-4322-b490-bd526c26475f',
          'name': 'Car 4',
          'subject_type': 'vehicle',
          'subject_subtype': 'car',
          'common_name': null,
          'additional': {},
          'created_at': '2020-06-08T09:22:29.159460-07:00',
          'updated_at': '2020-06-08T09:22:29.159497-07:00',
          'is_active': true,
          'tracks_available': false,
          'image_url': '/static/unassigned-black.svg'
        },
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-09-29T15:20:00.322000-07:00',
          'end_time': null
        },
        'start_location': null,
        'end_location': null,
        'events': [
          {
            'id': '52c1cee1-60db-4e03-bf63-102332ce68f1',
            'serial_number': 155023,
            'event_type': 'jtar',
            'priority': 200,
            'title': null,
            'state': 'resolved',
            'contains': [],
            'updated_at': '2021-09-30T17:28:17.063311-07:00',
            'is_collection': false
          }
        ],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/routine-patrol-icon.svg',
        'icon_id': 'routine-patrol-icon',
        'updates': [
          {
            'message': 'Report Added',
            'time': '2021-09-30T22:27:18.994292+00:00',
            'user': {
              'username': 'yazzm',
              'first_name': 'Yazz',
              'last_name': '',
              'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
              'content_type': 'accounts.user'
            },
            'type': 'add_event'
          }
        ]
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-09-29T22:20:11.407258+00:00',
        'user': {
          'username': 'denniss',
          'first_name': 'Dennis (Primary)',
          'last_name': '',
          'id': '6923e4ad-0cf5-4153-b915-0192cfb52c22',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': '40d5fe55-0cf4-4063-bec5-e80833ccd1d0',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1386,
    'title': null,
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': '304f5eda-800f-4157-b679-bada43053daa',
        'patrol_type': 'dog_patrol',
        'leader': null,
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-09-30T15:25:14.556000-07:00',
          'end_time': null
        },
        'start_location': null,
        'end_location': null,
        'events': [
          {
            'id': '297bd473-f964-45d4-88d7-f1a51f8578d5',
            'serial_number': 155024,
            'event_type': 'immobility',
            'priority': 0,
            'title': null,
            'state': 'resolved',
            'contains': [],
            'updated_at': '2021-10-01T15:32:32.052508-07:00',
            'is_collection': false
          }
        ],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/dog-patrol-icon.svg',
        'icon_id': 'dog-patrol-icon',
        'updates': [
          {
            'message': 'Report Added',
            'time': '2021-09-30T22:28:05.775361+00:00',
            'user': {
              'username': 'yazzm',
              'first_name': 'Yazz',
              'last_name': '',
              'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
              'content_type': 'accounts.user'
            },
            'type': 'add_event'
          }
        ]
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-09-30T22:25:16.249354+00:00',
        'user': {
          'username': 'yazzm',
          'first_name': 'Yazz',
          'last_name': '',
          'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': '53792f5b-f99b-4bec-9577-147ad1fc3acd',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1456,
    'title': null,
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': '79959bbb-b2a4-4ba0-aa11-dace7ef0ff5e',
        'patrol_type': 'dog_patrol',
        'leader': null,
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-11-01T11:50:15.348000-07:00',
          'end_time': null
        },
        'start_location': {
          'latitude': 0.20972935311753815,
          'longitude': 37.414685045175275
        },
        'end_location': null,
        'events': [],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/dog-patrol-icon.svg',
        'icon_id': 'dog-patrol-icon',
        'updates': []
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-11-01T18:50:17.349540+00:00',
        'user': {
          'username': 'luisd',
          'first_name': 'Luis',
          'last_name': 'Diaz',
          'id': '613493c8-9d23-42d9-a6ad-6861d1306f38',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': '5a841b20-5d62-4bc8-b704-af181c38e532',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1458,
    'title': null,
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': '7499a1c4-654e-42f1-b5bc-2211ad8cea31',
        'patrol_type': 'dog_patrol',
        'leader': null,
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-10-31T11:52:00-07:00',
          'end_time': null
        },
        'start_location': {
          'latitude': 0.19857074148823983,
          'longitude': 37.41635527845199
        },
        'end_location': null,
        'events': [],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/dog-patrol-icon.svg',
        'icon_id': 'dog-patrol-icon',
        'updates': []
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-11-01T18:52:25.739772+00:00',
        'user': {
          'username': 'luisd',
          'first_name': 'Luis',
          'last_name': 'Diaz',
          'id': '613493c8-9d23-42d9-a6ad-6861d1306f38',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': '4bc9241e-9e89-4320-b1af-93f724cddf0d',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1380,
    'title': 'editing title makes asset name dissapear',
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': 'b6827132-d7ba-4ff6-87c2-afb93c6e8483',
        'patrol_type': 'The_Don_Patrol',
        'leader': {
          'content_type': 'observations.subject',
          'id': '1e68cd47-e87a-4e27-a333-2f7349ec70d7',
          'name': 'Huawei',
          'subject_type': 'person',
          'subject_subtype': 'ranger',
          'common_name': null,
          'additional': {},
          'created_at': '2021-07-20T07:44:34.207911-07:00',
          'updated_at': '2021-07-20T07:44:34.207936-07:00',
          'is_active': true,
          'tracks_available': false,
          'image_url': '/static/ranger-black.svg'
        },
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-09-30T07:41:44.949000-07:00',
          'end_time': null
        },
        'start_location': null,
        'end_location': null,
        'events': [
          {
            'id': 'fe2e0161-13fa-413c-a323-b560f11627f3',
            'serial_number': 155025,
            'event_type': 'jenaeonefield',
            'priority': 200,
            'title': null,
            'state': 'new',
            'contains': [],
            'updated_at': '2021-09-30T15:28:46.248822-07:00',
            'is_collection': false
          }
        ],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/suspicious_person_rep.svg',
        'icon_id': 'suspicious_person_rep',
        'updates': [
          {
            'message': 'Report Added',
            'time': '2021-09-30T22:28:46.256713+00:00',
            'user': {
              'username': 'yazzm',
              'first_name': 'Yazz',
              'last_name': '',
              'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
              'content_type': 'accounts.user'
            },
            'type': 'add_event'
          }
        ]
      }
    ],
    'updates': [
      {
        'message': 'Updated fields: Title',
        'time': '2021-09-30T14:45:29.585655+00:00',
        'user': {
          'username': 'patsyi',
          'first_name': 'Patsy',
          'last_name': 'Iturbe',
          'id': 'e2dd3ea4-1281-4cf8-be77-78e10656f7cd',
          'content_type': 'accounts.user'
        },
        'type': 'update_patrol'
      },
      {
        'message': 'Patrol Added',
        'time': '2021-09-30T14:42:16.756893+00:00',
        'user': {
          'username': 'patsyi',
          'first_name': 'Patsy',
          'last_name': 'Iturbe',
          'id': 'e2dd3ea4-1281-4cf8-be77-78e10656f7cd',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': 'd4c63919-d524-4aff-9a8d-49fbfb9785f2',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1437,
    'title': null,
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': 'b9a64956-ee46-47c0-af64-88b9781c4059',
        'patrol_type': 'The_Don_Patrol',
        'leader': {
          'content_type': 'observations.subject',
          'id': 'cbc30781-4beb-4d4e-8336-25cb7b912452',
          'name': 'Huawei',
          'subject_type': 'person',
          'subject_subtype': 'ranger',
          'common_name': null,
          'additional': {},
          'created_at': '2021-10-14T14:02:20.209993-07:00',
          'updated_at': '2021-10-14T14:02:20.210035-07:00',
          'is_active': true,
          'tracks_available': false,
          'image_url': '/static/ranger-black.svg'
        },
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-10-13T09:30:00-07:00',
          'end_time': null
        },
        'start_location': null,
        'end_location': null,
        'events': [
          {
            'id': '58bab42f-225d-4c44-9914-5421d8388812',
            'serial_number': 155856,
            'event_type': 'spoor_rep',
            'priority': 200,
            'title': null,
            'state': 'active',
            'contains': [],
            'updated_at': '2021-10-19T14:54:48.617141-07:00',
            'is_collection': false
          }
        ],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/suspicious_person_rep.svg',
        'icon_id': 'suspicious_person_rep',
        'updates': [
          {
            'message': 'Report Added',
            'time': '2021-10-19T21:53:56.529053+00:00',
            'user': {
              'username': 'denniss',
              'first_name': 'Dennis (Primary)',
              'last_name': '',
              'id': '6923e4ad-0cf5-4153-b915-0192cfb52c22',
              'content_type': 'accounts.user'
            },
            'type': 'add_event'
          },
          {
            'message': 'Updated fields: Tracking Subject',
            'time': '2021-10-19T16:31:02.599724+00:00',
            'user': {
              'username': 'tiffanyw',
              'first_name': 'Tiffany',
              'last_name': 'Wong',
              'id': '7d5a78bd-ebfa-4424-880b-d2969101b610',
              'content_type': 'accounts.user'
            },
            'type': 'update_segment'
          },
          {
            'message': 'Updated fields: Tracking Subject',
            'time': '2021-10-19T16:30:54.851201+00:00',
            'user': {
              'username': 'tiffanyw',
              'first_name': 'Tiffany',
              'last_name': 'Wong',
              'id': '7d5a78bd-ebfa-4424-880b-d2969101b610',
              'content_type': 'accounts.user'
            },
            'type': 'update_segment'
          }
        ]
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-10-19T16:30:39.536222+00:00',
        'user': {
          'username': 'tiffanyw',
          'first_name': 'Tiffany',
          'last_name': 'Wong',
          'id': '7d5a78bd-ebfa-4424-880b-d2969101b610',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': 'e1df8099-3f02-4a17-90d8-2eada8ff6cda',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1412,
    'title': 'Patrols',
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': '767ceeb3-3a9b-4928-a2fa-46a4c5619e94',
        'patrol_type': 'dog_patrol',
        'leader': null,
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-10-05T17:35:55.999000-07:00',
          'end_time': null
        },
        'start_location': null,
        'end_location': null,
        'events': [],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/dog-patrol-icon.svg',
        'icon_id': 'dog-patrol-icon',
        'updates': []
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-10-06T00:36:09.516817+00:00',
        'user': {
          'username': 'yazzm',
          'first_name': 'Yazz',
          'last_name': '',
          'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': '93485e1d-6804-459b-9243-1d239556bb48',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1283,
    'title': 'Routine Patrol',
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': 'de3d2543-6fe9-4feb-860a-a739d9321333',
        'patrol_type': 'routine_patrol',
        'leader': {
          'content_type': 'observations.subject',
          'id': '1df1e382-f8e9-4978-aa7d-3ce93623f868',
          'name': 'Alpha 01',
          'subject_type': 'person',
          'subject_subtype': 'ranger',
          'common_name': null,
          'additional': {},
          'created_at': '2020-11-11T00:53:29.844716-08:00',
          'updated_at': '2020-11-11T00:53:29.844741-08:00',
          'is_active': true,
          'tracks_available': false,
          'image_url': '/static/ranger-gray.svg'
        },
        'scheduled_start': '2021-05-07T02:30:00-07:00',
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-11-01T10:13:30.395000-07:00',
          'end_time': null
        },
        'start_location': {
          'latitude': 40.45230400803598,
          'longitude': -3.6919209821695063
        },
        'end_location': {
          'latitude': 40.45223461341786,
          'longitude': -3.6855534179672986
        },
        'events': [],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/routine-patrol-icon.svg',
        'icon_id': 'routine-patrol-icon',
        'updates': [
          {
            'message': 'Updated fields: Start Time',
            'time': '2021-11-01T17:13:30.600165+00:00',
            'user': {
              'username': 'yazzm',
              'first_name': 'Yazz',
              'last_name': '',
              'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
              'content_type': 'accounts.user'
            },
            'type': 'update_segment'
          },
          {
            'message': 'Updated fields: ',
            'time': '2021-09-09T21:14:24.245361+00:00',
            'user': {
              'username': 'yazzm',
              'first_name': 'Yazz',
              'last_name': '',
              'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
              'content_type': 'accounts.user'
            },
            'type': 'update_segment'
          }
        ]
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-05-05T08:22:29.473113+00:00',
        'user': {
          'username': 'tebogok',
          'first_name': 'Tebogo',
          'last_name': 'Kgongwana',
          'id': '0497a788-852e-42ce-90ff-0a28e9b3653b',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': '9cfec786-a183-4e4d-979a-cd450108a224',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1406,
    'title': 'Test0101',
    'files': [],
    'notes': [
      {
        'id': 'eae73cb7-7127-41fe-9ed6-51af05114d71',
        'text': 'Dori',
        'updates': [
          {
            'message': 'Note Added',
            'time': '2021-10-06T00:39:27.269273+00:00',
            'text': 'Dori',
            'user': {
              'username': 'yazzm',
              'first_name': 'Yazz',
              'last_name': '',
              'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
              'content_type': 'accounts.user'
            },
            'type': 'add_patrolnote'
          }
        ]
      }
    ],
    'patrol_segments': [
      {
        'id': '70593728-ae3d-431e-b822-7bf49b945c92',
        'patrol_type': 'routine_patrol',
        'leader': null,
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-09-29T10:48:30.525000-07:00',
          'end_time': null
        },
        'start_location': null,
        'end_location': null,
        'events': [],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/routine-patrol-icon.svg',
        'icon_id': 'routine-patrol-icon',
        'updates': []
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-10-04T21:42:09.359523+00:00',
        'user': {
          'content_type': null
        },
        'type': 'add_patrol'
      }
    ]
  },
  {
    'id': '3abadf0b-3b08-4db8-94c1-c1f2c02a62ff',
    'priority': 0,
    'state': 'open',
    'objective': null,
    'serial_number': 1457,
    'title': 'The Don Patrol & Dog Patrol',
    'files': [],
    'notes': [],
    'patrol_segments': [
      {
        'id': '663cc276-6496-47f1-a4a6-7d876d148dc7',
        'patrol_type': 'The_Don_Patrol',
        'leader': null,
        'scheduled_start': null,
        'scheduled_end': null,
        'time_range': {
          'start_time': '2021-11-01T11:50:52.403000-07:00',
          'end_time': null
        },
        'start_location': {
          'latitude': 0.25777231999637706,
          'longitude': 37.464915547463164
        },
        'end_location': null,
        'events': [],
        'image_url': 'https://develop.pamdas.org/static/sprite-src/suspicious_person_rep.svg',
        'icon_id': 'suspicious_person_rep',
        'updates': []
      }
    ],
    'updates': [
      {
        'message': 'Patrol Added',
        'time': '2021-11-01T18:51:12.901760+00:00',
        'user': {
          'username': 'luisd',
          'first_name': 'Luis',
          'last_name': 'Diaz',
          'id': '613493c8-9d23-42d9-a6ad-6861d1306f38',
          'content_type': 'accounts.user'
        },
        'type': 'add_patrol'
      }
    ]
  }
];

export default patrols;

export const newPatrol = {
  'icon_id': 'dog-patrol-icon',
  'is_collection': false,
  'priority': 0,
  'created_at': '2022-01-18T22:34:52.494Z',
  'patrol_segments': [
    {
      'patrol_type': 'dog_patrol',
      'priority': 0,
      'events': [],
      'scheduled_start': null,
      'leader': null,
      'start_location': {
        'latitude': 20.820635171985415,
        'longitude': -103.35978574394501
      },
      'time_range': {
        'start_time': '2022-01-18T22:34:52.494Z',
        'end_time': null
      },
      'end_location': null
    }
  ],
  'files': [],
  'notes': [],
  'title': null
};

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
export const scheduledPatrol = {
  'id': 'e9c728a6-148b-475b-9311-668813581c2a',
  'priority': 0,
  'state': 'open',
  'objective': null,
  'serial_number': 1629,
  'title': 'Future',
  'files': [],
  'notes': [],
  'patrol_segments': [
    {
      'id': 'f3160c12-344f-4357-b2ca-5c3456f5e833',
      'patrol_type': 'dog_patrol',
      'leader': null,
      'scheduled_start': `${tomorrow.toISOString().slice(0, -5)}-08:00`,
      'scheduled_end': null,
      'time_range': {
        'start_time': null,
        'end_time': null
      },
      'start_location': {
        'latitude': 20.73511376906127,
        'longitude': -103.40970236937243
      },
      'end_location': null,
      'events': [],
      'image_url': 'https://develop.pamdas.org/static/sprite-src/dog-patrol-icon.svg',
      'icon_id': 'dog-patrol-icon',
      'updates': []
    }
  ],
  'updates': [
    {
      'message': 'Patrol Added',
      'time': '2022-01-17T19:23:47.216995+00:00',
      'user': {
        'username': 'lchavez',
        'first_name': 'Luis',
        'last_name': 'Chavez',
        'id': '2cc59835-ac53-4b78-b40a-2aa4ab93fe18',
        'content_type': 'accounts.user'
      },
      'type': 'add_patrol'
    }
  ]
};

export const activePatrol = {
  'id': '05113dd3-3f41-49ef-aa7d-fbc6b7379533',
  'priority': 0,
  'state': 'open',
  'objective': null,
  'serial_number': 1595,
  'title': 'The Don Patrol Aza',
  'files': [],
  'notes': [],
  'patrol_segments': [
    {
      'id': '0fa397c7-23ae-46ed-a811-7e33aa2190db',
      'patrol_type': 'The_Don_Patrol',
      'leader': null,
      'scheduled_start': '2022-01-07T10:17:00-08:00',
      'scheduled_end': '2022-01-08T10:17:00-08:00',
      'time_range': {
        'start_time': '2022-01-18T13:42:39.502000-08:00',
        'end_time': null
      },
      'start_location': null,
      'end_location': null,
      'events': [],
      'image_url': 'https://develop.pamdas.org/static/sprite-src/suspicious_person_rep.svg',
      'icon_id': 'suspicious_person_rep',
      'updates': [
        {
          'message': 'Updated fields: ',
          'time': '2022-01-18T22:04:22.401124+00:00',
          'user': {
            'username': 'yazzm',
            'first_name': 'Yazz',
            'last_name': '',
            'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
            'content_type': 'accounts.user'
          },
          'type': 'update_segment'
        },
        {
          'message': 'Updated fields: End Time',
          'time': '2022-01-18T21:42:44.781781+00:00',
          'user': {
            'username': 'yazzm',
            'first_name': 'Yazz',
            'last_name': '',
            'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
            'content_type': 'accounts.user'
          },
          'type': 'update_segment'
        },
        {
          'message': 'Updated fields: Start Time',
          'time': '2022-01-18T21:42:39.637430+00:00',
          'user': {
            'username': 'yazzm',
            'first_name': 'Yazz',
            'last_name': '',
            'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
            'content_type': 'accounts.user'
          },
          'type': 'update_segment'
        }
      ]
    }
  ],
  'updates': [
    {
      'message': 'Updated fields: State is open',
      'time': '2022-01-18T22:04:22.415344+00:00',
      'user': {
        'username': 'yazzm',
        'first_name': 'Yazz',
        'last_name': '',
        'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
        'content_type': 'accounts.user'
      },
      'type': 'update_patrol_state'
    },
    {
      'message': 'Updated fields: State is done',
      'time': '2022-01-18T21:42:44.799611+00:00',
      'user': {
        'username': 'yazzm',
        'first_name': 'Yazz',
        'last_name': '',
        'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
        'content_type': 'accounts.user'
      },
      'type': 'update_patrol_state'
    },
    {
      'message': 'Patrol Added',
      'time': '2022-01-05T18:17:47.436553+00:00',
      'user': {
        'username': 'azarael',
        'first_name': 'Azarael',
        'last_name': 'Romero',
        'id': '82641cc1-3025-42bb-ac50-2a634ed307d2',
        'content_type': 'accounts.user'
      },
      'type': 'add_patrol'
    }
  ]
};

export const overduePatrol = {
  'id': 'fe65464e-ea6d-4144-bba0-f9d901ffa46b',
  'priority': 0,
  'state': 'open',
  'objective': 'very ambitious objective',
  'serial_number': 1551,
  'title': null,
  'files': [],
  'notes': [],
  'patrol_segments': [
    {
      'id': '9884e2a2-0cb3-4b00-b75c-3048b7c34d94',
      'patrol_type': 'routine_patrol',
      'leader': {
        'content_type': 'observations.subject',
        'id': 'dba0e0a6-0083-41be-a0eb-99e956977748',
        'name': 'Alex',
        'subject_type': 'person',
        'subject_subtype': 'ranger',
        'common_name': null,
        'additional': {},
        'created_at': '2021-08-31T14:42:06.701541-07:00',
        'updated_at': '2021-08-31T14:42:06.701557-07:00',
        'is_active': true,
        'tracks_available': false,
        'image_url': '/static/ranger-black.svg'
      },
      'scheduled_start': '2021-11-25T11:28:00.215000-08:00',
      'scheduled_end': '2021-11-25T11:30:00.507000-08:00',
      'time_range': {
        'start_time': null,
        'end_time': null
      },
      'start_location': null,
      'end_location': null,
      'events': [
        {
          'id': 'e797c0a4-f063-498b-890a-3e065e7e4775',
          'serial_number': 156710,
          'event_type': 'rhino_sighting_rep',
          'priority': 0,
          'title': null,
          'state': 'new',
          'contains': [],
          'updated_at': '2021-11-25T11:27:01.975955-08:00',
          'geojson': {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [
                -98.65740154191465,
                39.25999430369339
              ]
            },
            'properties': {
              'message': '',
              'datetime': '2021-11-25T19:26:46.066000+00:00',
              'image': 'https://develop.pamdas.org/static/rhino_sighting-gray.svg',
              'icon': {
                'iconUrl': 'https://develop.pamdas.org/static/rhino_sighting-gray.svg',
                'iconSize': [
                  25,
                  25
                ],
                'iconAncor': [
                  12,
                  12
                ],
                'popupAncor': [
                  0,
                  -13
                ],
                'className': 'dot'
              }
            }
          },
          'is_collection': false
        }
      ],
      'image_url': 'https://develop.pamdas.org/static/sprite-src/routine-patrol-icon.svg',
      'icon_id': 'routine-patrol-icon',
      'updates': [
        {
          'message': 'Updated fields: Tracking Subject',
          'time': '2021-11-25T19:32:40.804899+00:00',
          'user': {
            'username': 'yazzm',
            'first_name': 'Yazz',
            'last_name': '',
            'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
            'content_type': 'accounts.user'
          },
          'type': 'update_segment'
        },
        {
          'message': 'Updated fields: ',
          'time': '2021-11-25T19:28:25.777428+00:00',
          'user': {
            'username': 'yazzm',
            'first_name': 'Yazz',
            'last_name': '',
            'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
            'content_type': 'accounts.user'
          },
          'type': 'update_segment'
        },
        {
          'message': 'Report Added',
          'time': '2021-11-25T19:27:01.982922+00:00',
          'user': {
            'username': 'yazzm',
            'first_name': 'Yazz',
            'last_name': '',
            'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
            'content_type': 'accounts.user'
          },
          'type': 'add_event'
        }
      ]
    }
  ],
  'updates': [
    {
      'message': 'Patrol Added',
      'time': '2021-11-25T19:25:58.621383+00:00',
      'user': {
        'username': 'yazzm',
        'first_name': 'Yazz',
        'last_name': '',
        'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
        'content_type': 'accounts.user'
      },
      'type': 'add_patrol'
    }
  ]
};

export const donePatrol = {
  'id': '36faa698-656a-4e4b-926c-d5147ac0967d',
  'priority': 0,
  'state': 'done',
  'objective': null,
  'serial_number': 1647,
  'title': null,
  'files': [],
  'notes': [],
  'patrol_segments': [
    {
      'id': '3347ef68-2df1-4864-9600-15be22590d29',
      'patrol_type': 'aerial_patrol',
      'leader': null,
      'scheduled_start': null,
      'scheduled_end': null,
      'time_range': {
        'start_time': '2022-01-18T14:12:12.474000-08:00',
        'end_time': '2022-01-18T14:12:24.074000-08:00'
      },
      'start_location': null,
      'end_location': null,
      'events': [],
      'image_url': 'https://develop.pamdas.org/static/sprite-src/steel_jaw_trap_rep.svg',
      'icon_id': 'steel_jaw_trap_rep',
      'updates': [
        {
          'message': 'Updated fields: End Time',
          'time': '2022-01-18T22:12:24.184723+00:00',
          'user': {
            'username': 'yazzm',
            'first_name': 'Yazz',
            'last_name': '',
            'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
            'content_type': 'accounts.user'
          },
          'type': 'update_segment'
        }
      ]
    }
  ],
  'updates': [
    {
      'message': 'Updated fields: State is done',
      'time': '2022-01-18T22:12:24.207505+00:00',
      'user': {
        'username': 'yazzm',
        'first_name': 'Yazz',
        'last_name': '',
        'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
        'content_type': 'accounts.user'
      },
      'type': 'update_patrol_state'
    },
    {
      'message': 'Patrol Added',
      'time': '2022-01-18T22:12:15.992602+00:00',
      'user': {
        'username': 'yazzm',
        'first_name': 'Yazz',
        'last_name': '',
        'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
        'content_type': 'accounts.user'
      },
      'type': 'add_patrol'
    }
  ]
};

export const cancelledPatrol = {
  'id': '05113dd3-3f41-49ef-aa7d-fbc6b7379533',
  'priority': 0,
  'state': 'cancelled',
  'objective': null,
  'serial_number': 1595,
  'title': 'The Don Patrol Aza',
  'files': [],
  'notes': [],
  'patrol_segments': [
    {
      'id': '0fa397c7-23ae-46ed-a811-7e33aa2190db',
      'patrol_type': 'The_Don_Patrol',
      'leader': null,
      'scheduled_start': '2022-01-07T10:17:00-08:00',
      'scheduled_end': '2022-01-08T10:17:00-08:00',
      'time_range': {
        'start_time': '2022-01-18T13:42:39.502000-08:00',
        'end_time': null
      },
      'start_location': null,
      'end_location': null,
      'events': [],
      'image_url': 'https://develop.pamdas.org/static/sprite-src/suspicious_person_rep.svg',
      'icon_id': 'suspicious_person_rep',
      'updates': [
        {
          'message': 'Updated fields: ',
          'time': '2022-01-18T22:04:22.401124+00:00',
          'user': {
            'username': 'yazzm',
            'first_name': 'Yazz',
            'last_name': '',
            'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
            'content_type': 'accounts.user'
          },
          'type': 'update_segment'
        },
        {
          'message': 'Updated fields: End Time',
          'time': '2022-01-18T21:42:44.781781+00:00',
          'user': {
            'username': 'yazzm',
            'first_name': 'Yazz',
            'last_name': '',
            'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
            'content_type': 'accounts.user'
          },
          'type': 'update_segment'
        },
        {
          'message': 'Updated fields: Start Time',
          'time': '2022-01-18T21:42:39.637430+00:00',
          'user': {
            'username': 'yazzm',
            'first_name': 'Yazz',
            'last_name': '',
            'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
            'content_type': 'accounts.user'
          },
          'type': 'update_segment'
        }
      ]
    }
  ],
  'updates': [
    {
      'message': 'Updated fields: State is cancelled',
      'time': '2022-01-18T22:42:04.843502+00:00',
      'user': {
        'username': 'lchavez',
        'first_name': 'Luis',
        'last_name': 'Chavez',
        'id': '2cc59835-ac53-4b78-b40a-2aa4ab93fe18',
        'content_type': 'accounts.user'
      },
      'type': 'update_patrol_state'
    },
    {
      'message': 'Updated fields: State is open',
      'time': '2022-01-18T22:04:22.415344+00:00',
      'user': {
        'username': 'yazzm',
        'first_name': 'Yazz',
        'last_name': '',
        'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
        'content_type': 'accounts.user'
      },
      'type': 'update_patrol_state'
    },
    {
      'message': 'Updated fields: State is done',
      'time': '2022-01-18T21:42:44.799611+00:00',
      'user': {
        'username': 'yazzm',
        'first_name': 'Yazz',
        'last_name': '',
        'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
        'content_type': 'accounts.user'
      },
      'type': 'update_patrol_state'
    },
    {
      'message': 'Patrol Added',
      'time': '2022-01-05T18:17:47.436553+00:00',
      'user': {
        'username': 'azarael',
        'first_name': 'Azarael',
        'last_name': 'Romero',
        'id': '82641cc1-3025-42bb-ac50-2a634ed307d2',
        'content_type': 'accounts.user'
      },
      'type': 'add_patrol'
    }
  ]
};

export const patrolDefaultStoreData = {
  data: {
    eventSchemas: {
      globalSchema: {
        properties: {
          reported_by: {
            enum_ext: [{
              value: { id: 'Leader 1' },
            }, {
              value: { id: 'Leader 2' },
            }],
          },
        },
      },
    },
    patrolLeaderSchema: {
      trackedbySchema: {
        properties: {
          leader: {
            enum_ext: [{
              value: { id: 'Leader 1' },
            }, {
              value: { id: 'Leader 2' },
            }],
          },
        },
      },
    },
    subjectStore: {},
    patrols: {
      results: [],
    },
  },
  view: {
    verticalNavigationBar: {
      currentTab: TAB_KEYS.PATROLS,
      data: {
        newPatrol,
      },
      showDetailView: false,
    },
  },
};
