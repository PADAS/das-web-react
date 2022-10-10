const event1 = {
  'id': '7a823381-fe73-41d7-a1b3-6ba55d72db25',
  'location': { 'latitude': '-27.090924192940143', 'longitude': '-109.36755278320345' },
  'time': '2021-08-10T22:00:58.671000-07:00',
  'end_time': null,
  'serial_number': 153001,
  'message': '',
  'provenance': '',
  'event_type': 'jenaeonefield',
  'priority': 200,
  'priority_label': 'Amber',
  'attributes': {},
  'comment': null,
  'title': null,
  'notes': [],
  'reported_by': null,
  'state': 'new',
  'event_details': {
    'duck_sighting': 'kjhkjh'
  }, 'contains': [],
  'is_linked_to': [],
  'is_contained_in': [],
  'files': [],
  'related_subjects': [],
  'sort_at': '2021-08-10T22:01:07.973131-07:00',
  'patrol_segments': [],
  'updated_at': '2021-08-10T22:01:07.973131-07:00',
  'created_at': '2021-08-10T22:01:07.973799-07:00',
  'icon_id': 'jenaeonefield',
  'event_category': 'sprinttesting',
  'url': 'https://develop.pamdas.org/api/v1.0/activity/event/7a823381-fe73-41d7-a1b3-6ba55d72db25',
  'image_url': 'https://develop.pamdas.org/static/generic-amber.svg',
  'geojson': {
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [-109.36755278320345, -27.090924192940143]
    },
    'properties': {
      'message': '',
      'datetime': '2021-08-11T05:00:58.671000+00:00',
      'image': 'https://develop.pamdas.org/static/generic-amber.svg',
      'icon': {
        'iconUrl': 'https://develop.pamdas.org/static/generic-amber.svg',
        'iconSize': [25, 25],
        'iconAncor': [12, 12],
        'popupAncor': [0, -13],
        'className': 'dot'
      }
    }
  },
  'is_collection': false,
  'updates': [
    {
      'message': 'Added',
      'time': '2021-08-11T05:01:07.982704+00:00',
      'user': {
        'username': 'yazzm',
        'first_name': 'Yazz',
        'last_name': '',
        'id': '4d4363e1-16d0-499b-856a-f8846ac23938',
        'content_type': 'accounts.user'
      },
      'type': 'add_event'
    }
  ],
  'patrols': []
};

const event2 = { 'id': 'd468814b-94e0-4c21-a923-0b901c2c0a8d', 'location': { 'latitude': '-27.11216520635709', 'longitude': '-109.35519316406285' }, 'time': '2021-07-17T21:59:50.986000-07:00', 'end_time': null, 'serial_number': 152999, 'message': '', 'provenance': '', 'event_type': 'rhino_sighting_rep', 'priority': 0, 'priority_label': 'Gray', 'attributes': {}, 'comment': null, 'title': null, 'notes': [], 'reported_by': null, 'state': 'new', 'event_details': { 'kittens': 'ab1f5f86-102c-4030-91f2-0a4e89144ff0', 'rhinosightingrep_Rhino': '43c6f6a0-823a-4bb5-9da6-c0910d6065d3', 'rhinosightingrep_activity': 'resting', 'rhinosightingrep_condition': 'three', 'rhinosightingrep_earnotchcount': 1 }, 'contains': [], 'is_linked_to': [], 'is_contained_in': [], 'files': [], 'related_subjects': [], 'sort_at': '2021-08-10T22:00:08.362317-07:00', 'patrol_segments': [], 'updated_at': '2021-08-10T22:00:08.362317-07:00', 'created_at': '2021-08-09T22:00:08.363196-07:00', 'icon_id': 'rhino_sighting_rep', 'event_category': 'monitoring', 'url': 'https://develop.pamdas.org/api/v1.0/activity/event/d468814b-94e0-4c21-a923-0b901c2c0a8d', 'image_url': 'https://develop.pamdas.org/static/rhino_sighting-gray.svg', 'geojson': { 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [-109.35519316406285, -27.11216520635709] }, 'properties': { 'message': '', 'datetime': '2021-08-11T04:59:50.986000+00:00', 'image': 'https://develop.pamdas.org/static/rhino_sighting-gray.svg', 'icon': { 'iconUrl': 'https://develop.pamdas.org/static/rhino_sighting-gray.svg', 'iconSize': [25, 25], 'iconAncor': [12, 12], 'popupAncor': [0, -13], 'className': 'dot' } } }, 'is_collection': false, 'updates': [{ 'message': 'Added', 'time': '2021-08-11T05:00:08.372338+00:00', 'user': { 'username': 'yazzm', 'first_name': 'Yazz', 'last_name': '', 'id': '4d4363e1-16d0-499b-856a-f8846ac23938', 'content_type': 'accounts.user' }, 'type': 'add_event' }], 'patrols': [] };
export const eventWithoutPatrol = { 'id': 'f7412cac-e03a-44c0-b35a-ca5e2f8efee5', 'location': null, 'time': '2021-07-09T09:28:30.262000-07:00', 'end_time': null, 'serial_number': 147739, 'message': '', 'provenance': '', 'event_type': 'jes_rep', 'priority': 0, 'priority_label': 'Gray', 'attributes': {}, 'comment': null, 'title': null, 'notes': [], 'reported_by': null, 'state': 'new', 'event_details': { 'type_accident': '12', 'animals_involved': 'coq au vin' }, 'contains': [], 'is_linked_to': [], 'is_contained_in': [], 'files': [], 'related_subjects': [], 'sort_at': '2021-07-09T09:29:04.390494-07:00', 'patrol_segments': [], 'updated_at': '2021-07-09T09:29:04.390494-07:00', 'created_at': '2021-07-09T09:29:04.391244-07:00', 'icon_id': 'jes_rep', 'event_category': 'security', 'url': 'https://develop.pamdas.org/api/v1.0/activity/event/f7412cac-e03a-44c0-b35a-ca5e2f8efee5', 'image_url': 'https://develop.pamdas.org/static/generic-gray.svg', 'is_collection': false, 'updates': [{ 'message': 'Added', 'time': '2021-07-09T16:29:04.398837+00:00', 'user': { 'username': 'joshuak', 'first_name': 'Joshua', 'last_name': 'Krautwurst', 'id': 'ff91fae4-e55b-4beb-8385-c76af78afa36', 'content_type': 'accounts.user' }, 'type': 'add_event' }], 'patrols': [] };

export const eventWithPatrol = {
  'id': '1029a480-3d72-4dc7-b203-aa7755783483',
  'location': {
    'latitude': '47.59983542789328',
    'longitude': '-122.34134632249985'
  },
  'time': '2021-09-24T08:59:46.987000-07:00',
  'end_time': null,
  'serial_number': 154942,
  'message': '',
  'provenance': '',
  'event_type': 'sc_nw_animal_obs',
  'priority': 100,
  'priority_label': 'Green',
  'attributes': {},
  'comment': null,
  'title': null,
  'notes': [],
  'reported_by': null,
  'state': 'new',
  'event_details': {},
  'contains': [],
  'is_linked_to': [],
  'is_contained_in': [],
  'files': [],
  'related_subjects': [],
  'sort_at': '2021-09-24T08:59:48.571295-07:00',
  'patrol_segments': [
    '5ff88f41-7e1c-4d67-b557-a42522863ee9'
  ],
  'updated_at': '2021-09-24T08:59:48.571295-07:00',
  'created_at': '2021-09-24T08:59:48.571917-07:00',
  'icon_id': 'wildlife_sighting_rep_SMART',
  'event_category': 'smartconnect',
  'url': 'https://develop.pamdas.org/api/v1.0/activity/event/1029a480-3d72-4dc7-b203-aa7755783483',
  'image_url': 'https://develop.pamdas.org/static/sprite-src/wildlife_sighting_rep_SMART.svg',
  'geojson': {
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [
        -122.34134632249985,
        47.59983542789328
      ]
    },
    'properties': {
      'message': '',
      'datetime': '2021-09-24T15:59:46.987000+00:00',
      'image': 'https://develop.pamdas.org/static/sprite-src/wildlife_sighting_rep_SMART.svg',
      'icon': {
        'iconUrl': 'https://develop.pamdas.org/static/sprite-src/wildlife_sighting_rep_SMART.svg',
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
  'is_collection': false,
  'updates': [
    {
      'message': 'Added',
      'time': '2021-09-24T15:59:48.578625+00:00',
      'user': {
        'username': 'joshuak',
        'first_name': 'Joshua',
        'last_name': 'Krautwurst',
        'id': 'ff91fae4-e55b-4beb-8385-c76af78afa36',
        'content_type': 'accounts.user'
      },
      'type': 'add_event'
    }
  ],
  'patrols': [
    'dd1e708e-e3b3-410a-964e-fed7dbbcb01e'
  ]
};

export const events = [event1, event2, eventWithoutPatrol, eventWithPatrol];

export const eventsWithGeometries = [
  {
    id: '3662f167-37f6-4c75-9d93-673f436aa1a6',
    is_collection: false,
    location: {
      latitude: 5.8676,
      longitude: 18.714
    },
    time: '2022-08-09T07:08:58.338Z',
    serial_number: 19827,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'voluptas modi quia',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T07:08:58.338Z',
    geojson: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          18.714,
          5.8676
        ]
      },
      properties: {
        image: null
      }
    },
    patrol_segments: [],
    updated_at: '2022-08-09T07:08:58.338Z',
    created_at: '2022-08-09T07:08:58.338Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/3662f167-37f6-4c75-9d93-673f436aa1a6',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '8b386bfe-227e-40a0-97de-425abfcb3289',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  58.31891231904782,
                  -32.95903350246844
                ],
                [
                  58.47630823380208,
                  -32.59422031588628
                ],
                [
                  58.62248893060512,
                  -32.69629040415761
                ],
                [
                  57.291173483506896,
                  -33.91600187660145
                ],
                [
                  56.81251637929487,
                  -33.02717890265869
                ],
                [
                  58.31891231904782,
                  -32.95903350246844
                ]
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-08T23:27:00.304Z',
    serial_number: 24628,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'non impedit consequuntur',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-08T23:27:00.304Z',
    geojson: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [
              58.31891231904782,
              -32.95903350246844
            ],
            [
              58.47630823380208,
              -32.59422031588628
            ],
            [
              58.62248893060512,
              -32.69629040415761
            ],
            [
              57.291173483506896,
              -33.91600187660145
            ],
            [
              56.81251637929487,
              -33.02717890265869
            ],
            [
              58.31891231904782,
              -32.95903350246844
            ]
          ]
        ]
      }
    },
    patrol_segments: [],
    updated_at: '2022-08-08T23:27:00.304Z',
    created_at: '2022-08-08T23:27:00.304Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/8b386bfe-227e-40a0-97de-425abfcb3289',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '7aca0a7b-bc07-4cae-978e-299be781f41e',
    is_collection: false,
    location: {
      latitude: 4.1387,
      longitude: -64.5653
    },
    time: '2022-08-09T00:07:49.626Z',
    serial_number: 46819,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 0,
    priority_label: 'Gray',
    attributes: {},
    comment: null,
    title: 'minima ullam sapiente',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T00:07:49.626Z',
    geojson: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          -64.5653,
          4.1387
        ]
      },
      properties: {
        image: null
      }
    },
    patrol_segments: [],
    updated_at: '2022-08-09T00:07:49.626Z',
    created_at: '2022-08-09T00:07:49.626Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/7aca0a7b-bc07-4cae-978e-299be781f41e',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: 'c79f5fc2-db51-4ca5-bb0c-51dbb327733b',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -26.648331836597308,
                  37.90138597515508
                ],
                [
                  -25.65367556715538,
                  38.62991697256428
                ],
                [
                  -26.50128332098931,
                  38.58959189412259
                ],
                [
                  -25.941869045703644,
                  38.87121227865869
                ],
                [
                  -26.648331836597308,
                  37.90138597515508
                ]
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-08T23:21:46.800Z',
    serial_number: 55962,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'unde quas quis',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-08T23:21:46.800Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -26.648331836597308,
                  37.90138597515508
                ],
                [
                  -25.65367556715538,
                  38.62991697256428
                ],
                [
                  -26.50128332098931,
                  38.58959189412259
                ],
                [
                  -25.941869045703644,
                  38.87121227865869
                ],
                [
                  -26.648331836597308,
                  37.90138597515508
                ]
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-08T23:21:46.800Z',
    created_at: '2022-08-08T23:21:46.800Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/c79f5fc2-db51-4ca5-bb0c-51dbb327733b',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '7015ce8e-f001-4ffd-b6e5-69377f5328ce',
    is_collection: false,
    location: {
      latitude: 18.6394,
      longitude: -137.8223
    },
    time: '2022-08-08T21:52:50.481Z',
    serial_number: 83279,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 0,
    priority_label: 'Gray',
    attributes: {},
    comment: null,
    title: 'et autem corporis',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-08T21:52:50.481Z',
    geojson: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          -137.8223,
          18.6394
        ]
      },
      properties: {
        image: null
      }
    },
    patrol_segments: [],
    updated_at: '2022-08-08T21:52:50.481Z',
    created_at: '2022-08-08T21:52:50.481Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/7015ce8e-f001-4ffd-b6e5-69377f5328ce',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: 'b6be7204-2fc0-4aee-8de3-b32cdf5db903',
    is_collection: false,
    location: {
      latitude: -49.3318,
      longitude: 106.2632
    },
    time: '2022-08-08T21:24:56.128Z',
    serial_number: 28302,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'ratione autem maiores',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-08T21:24:56.128Z',
    geojson: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          106.2632,
          -49.3318
        ]
      },
      properties: {
        image: null
      }
    },
    patrol_segments: [],
    updated_at: '2022-08-08T21:24:56.128Z',
    created_at: '2022-08-08T21:24:56.128Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/b6be7204-2fc0-4aee-8de3-b32cdf5db903',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '95956d5b-c87e-4688-a4f7-8bd2f6dc230b',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  21.71454524423755,
                  -33.577261173873644
                ],
                [
                  22.79483877191286,
                  -34.8245894092409
                ],
                [
                  22.921557395270522,
                  -33.82486590218523
                ],
                [
                  22.927871681616946,
                  -35.07040738993692
                ],
                [
                  21.114434859574548,
                  -34.21807927776769
                ],
                [
                  21.197866650511433,
                  -34.29109936577781
                ],
                [
                  22.74399511991152,
                  -34.455982298476094
                ],
                [
                  21.35317477938642,
                  -34.004905374755964
                ],
                [
                  21.71454524423755,
                  -33.577261173873644
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -37.93244731651008,
                26.009225010824238
              ],
              [
                -38.98459858251828,
                27.171639122934444
              ],
              [
                -39.57259333821442,
                25.918392618559572
              ],
              [
                -38.06678268751085,
                26.031150030658722
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T10:19:46.952Z',
    serial_number: 74573,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 300,
    priority_label: 'Red',
    attributes: {},
    comment: null,
    title: 'placeat rem labore',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T10:19:46.952Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  21.71454524423755,
                  -33.577261173873644
                ],
                [
                  22.79483877191286,
                  -34.8245894092409
                ],
                [
                  22.921557395270522,
                  -33.82486590218523
                ],
                [
                  22.927871681616946,
                  -35.07040738993692
                ],
                [
                  21.114434859574548,
                  -34.21807927776769
                ],
                [
                  21.197866650511433,
                  -34.29109936577781
                ],
                [
                  22.74399511991152,
                  -34.455982298476094
                ],
                [
                  21.35317477938642,
                  -34.004905374755964
                ],
                [
                  21.71454524423755,
                  -33.577261173873644
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -37.93244731651008,
                26.009225010824238
              ],
              [
                -38.98459858251828,
                27.171639122934444
              ],
              [
                -39.57259333821442,
                25.918392618559572
              ],
              [
                -38.06678268751085,
                26.031150030658722
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T10:19:46.952Z',
    created_at: '2022-08-09T10:19:46.952Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/95956d5b-c87e-4688-a4f7-8bd2f6dc230b',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '2a9247f7-51d4-4715-8bb5-774e1ab33a31',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  14.006650720373226,
                  27.004520946766785
                ],
                [
                  12.369833583764335,
                  28.029005731941826
                ],
                [
                  12.348234758397545,
                  28.10672434662496
                ],
                [
                  13.004733005659958,
                  26.69641549087727
                ],
                [
                  12.716027898613099,
                  26.578790186978473
                ],
                [
                  14.006650720373226,
                  27.004520946766785
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -52.05054887400978,
                16.372947157557412
              ],
              [
                -52.41008478854815,
                17.57951100455127
              ],
              [
                -51.22822817843433,
                17.1312122455733
              ],
              [
                -52.01701232549023,
                17.08037515012825
              ],
              [
                -53.012673975275455,
                17.872771614672295
              ],
              [
                -52.914178451627144,
                17.08235018561304
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T07:09:59.347Z',
    serial_number: 15268,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 0,
    priority_label: 'Gray',
    attributes: {},
    comment: null,
    title: 'repellat nemo aliquam',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T07:09:59.347Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  14.006650720373226,
                  27.004520946766785
                ],
                [
                  12.369833583764335,
                  28.029005731941826
                ],
                [
                  12.348234758397545,
                  28.10672434662496
                ],
                [
                  13.004733005659958,
                  26.69641549087727
                ],
                [
                  12.716027898613099,
                  26.578790186978473
                ],
                [
                  14.006650720373226,
                  27.004520946766785
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -52.05054887400978,
                16.372947157557412
              ],
              [
                -52.41008478854815,
                17.57951100455127
              ],
              [
                -51.22822817843433,
                17.1312122455733
              ],
              [
                -52.01701232549023,
                17.08037515012825
              ],
              [
                -53.012673975275455,
                17.872771614672295
              ],
              [
                -52.914178451627144,
                17.08235018561304
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T07:09:59.347Z',
    created_at: '2022-08-09T07:09:59.347Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/2a9247f7-51d4-4715-8bb5-774e1ab33a31',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: 'c6e3c692-2e94-4770-9b73-437e6164d0fa',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -41.03055067343548,
                -40.201902868413015
              ],
              [
                -40.53977378509824,
                -41.05803079317386
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-08T21:08:57.831Z',
    serial_number: 43337,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 300,
    priority_label: 'Red',
    attributes: {},
    comment: null,
    title: 'saepe iusto quia',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-08T21:08:57.831Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -41.03055067343548,
                -40.201902868413015
              ],
              [
                -40.53977378509824,
                -41.05803079317386
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-08T21:08:57.831Z',
    created_at: '2022-08-08T21:08:57.831Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/c6e3c692-2e94-4770-9b73-437e6164d0fa',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: 'd578cddd-6d88-45c1-bb12-c45f4a860aa1',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -70.43830680229635,
                  -33.67594390566794
                ],
                [
                  -71.66619240169814,
                  -34.258348365216804
                ],
                [
                  -71.06030545709889,
                  -33.05800526952214
                ],
                [
                  -71.57170454641091,
                  -32.329574996907745
                ],
                [
                  -70.43830680229635,
                  -33.67594390566794
                ]
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T03:17:06.526Z',
    serial_number: 55422,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'quo voluptatum sequi',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T03:17:06.526Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -70.43830680229635,
                  -33.67594390566794
                ],
                [
                  -71.66619240169814,
                  -34.258348365216804
                ],
                [
                  -71.06030545709889,
                  -33.05800526952214
                ],
                [
                  -71.57170454641091,
                  -32.329574996907745
                ],
                [
                  -70.43830680229635,
                  -33.67594390566794
                ]
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T03:17:06.526Z',
    created_at: '2022-08-09T03:17:06.526Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/d578cddd-6d88-45c1-bb12-c45f4a860aa1',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '3e95f218-0cc4-45c6-b87f-dc2d50eaafe7',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  24.913451645754222,
                  16.52143653988667
                ],
                [
                  25.375976870678823,
                  15.416881388398236
                ],
                [
                  24.73551298960445,
                  16.470154702024438
                ],
                [
                  24.092222770993686,
                  15.632294736632327
                ],
                [
                  24.190812857066955,
                  16.69280217050622
                ],
                [
                  24.198374858393006,
                  15.556229738559079
                ],
                [
                  24.92288019794516,
                  15.819658103709456
                ],
                [
                  24.913451645754222,
                  16.52143653988667
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -55.07438196742204,
                34.06649722136444
              ],
              [
                -53.79694970970389,
                34.632996730000386
              ],
              [
                -55.09858708195708,
                34.26360660908166
              ],
              [
                -53.747543572718996,
                34.17340085043864
              ],
              [
                -54.43254076886894,
                34.04545457383024
              ],
              [
                -54.857847687613,
                34.27608830824885
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T08:40:56.736Z',
    serial_number: 75424,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'iusto aliquam soluta',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T08:40:56.736Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  24.913451645754222,
                  16.52143653988667
                ],
                [
                  25.375976870678823,
                  15.416881388398236
                ],
                [
                  24.73551298960445,
                  16.470154702024438
                ],
                [
                  24.092222770993686,
                  15.632294736632327
                ],
                [
                  24.190812857066955,
                  16.69280217050622
                ],
                [
                  24.198374858393006,
                  15.556229738559079
                ],
                [
                  24.92288019794516,
                  15.819658103709456
                ],
                [
                  24.913451645754222,
                  16.52143653988667
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -55.07438196742204,
                34.06649722136444
              ],
              [
                -53.79694970970389,
                34.632996730000386
              ],
              [
                -55.09858708195708,
                34.26360660908166
              ],
              [
                -53.747543572718996,
                34.17340085043864
              ],
              [
                -54.43254076886894,
                34.04545457383024
              ],
              [
                -54.857847687613,
                34.27608830824885
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T08:40:56.736Z',
    created_at: '2022-08-09T08:40:56.736Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/3e95f218-0cc4-45c6-b87f-dc2d50eaafe7',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: 'f177a389-b346-478c-af08-5ee9dd1f8f74',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  84.6813626130614,
                  44.00479282811236
                ],
                [
                  84.10679067327445,
                  43.81964650665347
                ],
                [
                  83.30697997002116,
                  43.18507414623619
                ],
                [
                  84.77884681189929,
                  44.45433094963382
                ],
                [
                  84.73833899774574,
                  44.100916841266866
                ],
                [
                  84.6813626130614,
                  44.00479282811236
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -59.5246593896318,
                -6.3144032390444
              ],
              [
                -59.54309815772664,
                -6.740519650612939
              ],
              [
                -58.796322406167775,
                -5.747093941331829
              ],
              [
                -58.92687397994478,
                -6.27955958152507
              ],
              [
                -58.73268471306185,
                -7.29322812149023
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T15:31:55.853Z',
    serial_number: 37454,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 0,
    priority_label: 'Gray',
    attributes: {},
    comment: null,
    title: 'laboriosam reprehenderit sint',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T15:31:55.853Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  84.6813626130614,
                  44.00479282811236
                ],
                [
                  84.10679067327445,
                  43.81964650665347
                ],
                [
                  83.30697997002116,
                  43.18507414623619
                ],
                [
                  84.77884681189929,
                  44.45433094963382
                ],
                [
                  84.73833899774574,
                  44.100916841266866
                ],
                [
                  84.6813626130614,
                  44.00479282811236
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -59.5246593896318,
                -6.3144032390444
              ],
              [
                -59.54309815772664,
                -6.740519650612939
              ],
              [
                -58.796322406167775,
                -5.747093941331829
              ],
              [
                -58.92687397994478,
                -6.27955958152507
              ],
              [
                -58.73268471306185,
                -7.29322812149023
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T15:31:55.853Z',
    created_at: '2022-08-09T15:31:55.853Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/f177a389-b346-478c-af08-5ee9dd1f8f74',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '6f89fb78-1214-4173-9cb2-1519590b39f4',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -48.99645498947074,
                  -31.694757493362065
                ],
                [
                  -50.34902233011798,
                  -31.334628175608444
                ],
                [
                  -50.37601550285307,
                  -30.83683601409894
                ],
                [
                  -48.84148425232448,
                  -30.52545693594347
                ],
                [
                  -49.683619413220406,
                  -30.390785442143095
                ],
                [
                  -49.92130220005519,
                  -31.834697315873946
                ],
                [
                  -49.16882911142942,
                  -31.759067629722015
                ],
                [
                  -49.19920938795309,
                  -30.431057327445128
                ],
                [
                  -48.99645498947074,
                  -31.694757493362065
                ]
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T00:54:59.092Z',
    serial_number: 91640,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 0,
    priority_label: 'Gray',
    attributes: {},
    comment: null,
    title: 'incidunt atque quaerat',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T00:54:59.092Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -48.99645498947074,
                  -31.694757493362065
                ],
                [
                  -50.34902233011798,
                  -31.334628175608444
                ],
                [
                  -50.37601550285307,
                  -30.83683601409894
                ],
                [
                  -48.84148425232448,
                  -30.52545693594347
                ],
                [
                  -49.683619413220406,
                  -30.390785442143095
                ],
                [
                  -49.92130220005519,
                  -31.834697315873946
                ],
                [
                  -49.16882911142942,
                  -31.759067629722015
                ],
                [
                  -49.19920938795309,
                  -30.431057327445128
                ],
                [
                  -48.99645498947074,
                  -31.694757493362065
                ]
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T00:54:59.092Z',
    created_at: '2022-08-09T00:54:59.092Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/6f89fb78-1214-4173-9cb2-1519590b39f4',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: 'ff7917ef-2bd8-46b2-a27b-ac7e55a3a29f',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  37.403408034763864,
                  -32.0727260892717
                ],
                [
                  38.140680475028226,
                  -32.902853640326214
                ],
                [
                  37.44663990916186,
                  -32.88385286531698
                ],
                [
                  36.88284770972184,
                  -32.92042664001505
                ],
                [
                  38.06816120823741,
                  -33.375765409798554
                ],
                [
                  36.80689848762677,
                  -32.78840105278222
                ],
                [
                  37.28996945860407,
                  -33.35805730094477
                ],
                [
                  36.886795989931066,
                  -33.39116003895198
                ],
                [
                  37.403408034763864,
                  -32.0727260892717
                ]
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-08T20:09:52.004Z',
    serial_number: 45069,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'vel molestiae dolores',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-08T20:09:52.004Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  37.403408034763864,
                  -32.0727260892717
                ],
                [
                  38.140680475028226,
                  -32.902853640326214
                ],
                [
                  37.44663990916186,
                  -32.88385286531698
                ],
                [
                  36.88284770972184,
                  -32.92042664001505
                ],
                [
                  38.06816120823741,
                  -33.375765409798554
                ],
                [
                  36.80689848762677,
                  -32.78840105278222
                ],
                [
                  37.28996945860407,
                  -33.35805730094477
                ],
                [
                  36.886795989931066,
                  -33.39116003895198
                ],
                [
                  37.403408034763864,
                  -32.0727260892717
                ]
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-08T20:09:52.004Z',
    created_at: '2022-08-08T20:09:52.004Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/ff7917ef-2bd8-46b2-a27b-ac7e55a3a29f',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: 'b72417fe-8a9f-4c80-a785-814e73d23e67',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -1.0481468095408397,
                  -42.14558667292028
                ],
                [
                  -0.18393121078274266,
                  -42.60406483565747
                ],
                [
                  -0.28174895802982713,
                  -42.212030476198244
                ],
                [
                  -1.4014110342254542,
                  -42.10757737941817
                ],
                [
                  -1.305156793075811,
                  -41.39995567129089
                ],
                [
                  0.15996610185090532,
                  -41.922753823871545
                ],
                [
                  -1.3856298533871683,
                  -42.757060405702845
                ],
                [
                  -1.0481468095408397,
                  -42.14558667292028
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -7.8991099769169795,
                -13.686617815089415
              ],
              [
                -7.782174569399189,
                -14.03630704711734
              ],
              [
                -7.304928734362815,
                -14.790482944833718
              ],
              [
                -7.204273924422222,
                -14.315725709753611
              ],
              [
                -8.687935972428752,
                -14.523989663594968
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T11:10:57.485Z',
    serial_number: 64728,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'eaque totam quibusdam',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T11:10:57.485Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -1.0481468095408397,
                  -42.14558667292028
                ],
                [
                  -0.18393121078274266,
                  -42.60406483565747
                ],
                [
                  -0.28174895802982713,
                  -42.212030476198244
                ],
                [
                  -1.4014110342254542,
                  -42.10757737941817
                ],
                [
                  -1.305156793075811,
                  -41.39995567129089
                ],
                [
                  0.15996610185090532,
                  -41.922753823871545
                ],
                [
                  -1.3856298533871683,
                  -42.757060405702845
                ],
                [
                  -1.0481468095408397,
                  -42.14558667292028
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -7.8991099769169795,
                -13.686617815089415
              ],
              [
                -7.782174569399189,
                -14.03630704711734
              ],
              [
                -7.304928734362815,
                -14.790482944833718
              ],
              [
                -7.204273924422222,
                -14.315725709753611
              ],
              [
                -8.687935972428752,
                -14.523989663594968
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T11:10:57.485Z',
    created_at: '2022-08-09T11:10:57.485Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/b72417fe-8a9f-4c80-a785-814e73d23e67',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: 'b0a86e74-a6be-4966-9c60-0ae7a38166e7',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -44.11361488176315,
                40.69274389451976
              ],
              [
                -44.04418237379315,
                41.570682376321535
              ],
              [
                -44.70456300254214,
                42.2111126849176
              ],
              [
                -45.7497783182043,
                41.70519294491056
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T01:36:10.006Z',
    serial_number: 12803,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'earum ut nihil',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T01:36:10.006Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -44.11361488176315,
                40.69274389451976
              ],
              [
                -44.04418237379315,
                41.570682376321535
              ],
              [
                -44.70456300254214,
                42.2111126849176
              ],
              [
                -45.7497783182043,
                41.70519294491056
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T01:36:10.006Z',
    created_at: '2022-08-09T01:36:10.006Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/b0a86e74-a6be-4966-9c60-0ae7a38166e7',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '2b49d733-75d7-42b9-a9ab-9e860bc2c317',
    is_collection: false,
    location: {
      latitude: -86.7711,
      longitude: -64.5729
    },
    time: '2022-08-09T02:33:21.476Z',
    serial_number: 61442,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 0,
    priority_label: 'Gray',
    attributes: {},
    comment: null,
    title: 'voluptates quia provident',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T02:33:21.476Z',
    geojson: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          -64.5729,
          -86.7711
        ]
      },
      properties: {
        image: null
      }
    },
    patrol_segments: [],
    updated_at: '2022-08-09T02:33:21.476Z',
    created_at: '2022-08-09T02:33:21.476Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/2b49d733-75d7-42b9-a9ab-9e860bc2c317',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '67da09a6-66ab-4a6e-bfb0-26658799092e',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -0.8490165783834955,
                  10.718199720227844
                ],
                [
                  -1.0223203797490963,
                  10.926171859476298
                ],
                [
                  -2.0680637477401977,
                  10.10415511520666
                ],
                [
                  -2.273461565014495,
                  10.207289407986613
                ],
                [
                  -1.2020445141625575,
                  11.006580060419177
                ],
                [
                  -1.1183660283597312,
                  9.622188334999313
                ],
                [
                  -1.6767811196094136,
                  9.784309106196096
                ],
                [
                  -0.8490165783834955,
                  10.718199720227844
                ]
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T13:25:56.447Z',
    serial_number: 4106,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'veritatis recusandae sed',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T13:25:56.447Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -0.8490165783834955,
                  10.718199720227844
                ],
                [
                  -1.0223203797490963,
                  10.926171859476298
                ],
                [
                  -2.0680637477401977,
                  10.10415511520666
                ],
                [
                  -2.273461565014495,
                  10.207289407986613
                ],
                [
                  -1.2020445141625575,
                  11.006580060419177
                ],
                [
                  -1.1183660283597312,
                  9.622188334999313
                ],
                [
                  -1.6767811196094136,
                  9.784309106196096
                ],
                [
                  -0.8490165783834955,
                  10.718199720227844
                ]
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T13:25:56.447Z',
    created_at: '2022-08-09T13:25:56.447Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/67da09a6-66ab-4a6e-bfb0-26658799092e',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '48045a16-7912-40e1-84ab-bda51ca38fb1',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -87.06503766053736,
                  30.93389422187755
                ],
                [
                  -88.22086496089835,
                  32.05179399565294
                ],
                [
                  -87.90586026647166,
                  30.531171779371338
                ],
                [
                  -88.84683206892807,
                  30.348433341381106
                ],
                [
                  -87.37349961376155,
                  32.1758610591066
                ],
                [
                  -87.66176720946393,
                  31.062334341659458
                ],
                [
                  -87.06503766053736,
                  30.93389422187755
                ]
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T11:09:08.966Z',
    serial_number: 54344,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'maxime sint distinctio',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T11:09:08.966Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -87.06503766053736,
                  30.93389422187755
                ],
                [
                  -88.22086496089835,
                  32.05179399565294
                ],
                [
                  -87.90586026647166,
                  30.531171779371338
                ],
                [
                  -88.84683206892807,
                  30.348433341381106
                ],
                [
                  -87.37349961376155,
                  32.1758610591066
                ],
                [
                  -87.66176720946393,
                  31.062334341659458
                ],
                [
                  -87.06503766053736,
                  30.93389422187755
                ]
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T11:09:08.966Z',
    created_at: '2022-08-09T11:09:08.966Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/48045a16-7912-40e1-84ab-bda51ca38fb1',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '5e610fe3-accc-43fe-81cd-7d46f5d1dd9e',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  26.791655378843018,
                  -21.942053283085432
                ],
                [
                  25.308873573920746,
                  -21.618094900613073
                ],
                [
                  26.602353339013057,
                  -20.21115070625405
                ],
                [
                  25.634433503515464,
                  -21.944353583023357
                ],
                [
                  25.686643644323023,
                  -20.699211271562383
                ],
                [
                  26.791655378843018,
                  -21.942053283085432
                ]
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T06:30:56.779Z',
    serial_number: 84750,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 200,
    priority_label: 'Amber',
    attributes: {},
    comment: null,
    title: 'minima iusto aut',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T06:30:56.779Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  26.791655378843018,
                  -21.942053283085432
                ],
                [
                  25.308873573920746,
                  -21.618094900613073
                ],
                [
                  26.602353339013057,
                  -20.21115070625405
                ],
                [
                  25.634433503515464,
                  -21.944353583023357
                ],
                [
                  25.686643644323023,
                  -20.699211271562383
                ],
                [
                  26.791655378843018,
                  -21.942053283085432
                ]
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T06:30:56.779Z',
    created_at: '2022-08-09T06:30:56.779Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/5e610fe3-accc-43fe-81cd-7d46f5d1dd9e',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '80048d66-833a-4ba4-9242-039f5a5df493',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -74.77930427446387,
                  -29.63351814128227
                ],
                [
                  -75.47644226009892,
                  -28.673832642096254
                ],
                [
                  -75.05311006993301,
                  -27.850762049803144
                ],
                [
                  -75.41856254984461,
                  -28.948315292241315
                ],
                [
                  -74.77930427446387,
                  -29.63351814128227
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -62.03927027050706,
                -43.51924413806331
              ],
              [
                -62.083516190165135,
                -42.90929347497574
              ],
              [
                -61.9844606301299,
                -44.386686290895966
              ],
              [
                -61.06596188629803,
                -43.926775648494306
              ],
              [
                -61.746983206582684,
                -42.94246731682233
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T03:25:43.747Z',
    serial_number: 72557,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 0,
    priority_label: 'Gray',
    attributes: {},
    comment: null,
    title: 'facere id alias',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T03:25:43.747Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  -74.77930427446387,
                  -29.63351814128227
                ],
                [
                  -75.47644226009892,
                  -28.673832642096254
                ],
                [
                  -75.05311006993301,
                  -27.850762049803144
                ],
                [
                  -75.41856254984461,
                  -28.948315292241315
                ],
                [
                  -74.77930427446387,
                  -29.63351814128227
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                -62.03927027050706,
                -43.51924413806331
              ],
              [
                -62.083516190165135,
                -42.90929347497574
              ],
              [
                -61.9844606301299,
                -44.386686290895966
              ],
              [
                -61.06596188629803,
                -43.926775648494306
              ],
              [
                -61.746983206582684,
                -42.94246731682233
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T03:25:43.747Z',
    created_at: '2022-08-09T03:25:43.747Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/80048d66-833a-4ba4-9242-039f5a5df493',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '8f1e7e7d-d0b7-4dc8-8654-6099f2ee2f25',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                37.73228088125913,
                4.329948630882107
              ],
              [
                37.24285738968075,
                5.641111502716894
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T04:46:19.917Z',
    serial_number: 2694,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'et repellat molestias',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T04:46:19.917Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                37.73228088125913,
                4.329948630882107
              ],
              [
                37.24285738968075,
                5.641111502716894
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T04:46:19.917Z',
    created_at: '2022-08-09T04:46:19.917Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/8f1e7e7d-d0b7-4dc8-8654-6099f2ee2f25',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '2dbe4370-264f-4139-abf0-10c12b78cdcd',
    is_collection: false,
    geometry: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  69.35742941331213,
                  -5.387410500528965
                ],
                [
                  69.47323234743004,
                  -5.019665619668845
                ],
                [
                  69.90982670898086,
                  -4.904904460134057
                ],
                [
                  69.45680690279613,
                  -5.962741051082247
                ],
                [
                  69.35742941331213,
                  -5.387410500528965
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                67.1555441458282,
                13.763230930181122
              ],
              [
                66.65037668572187,
                14.296686922529867
              ],
              [
                68.01012959047013,
                14.576458471041452
              ],
              [
                67.60379570630441,
                13.47923752604193
              ],
              [
                67.68879369109122,
                14.960117627380354
              ],
              [
                66.55141411021768,
                13.932304405899783
              ]
            ]
          }
        }
      ]
    },
    location: null,
    time: '2022-08-09T09:12:37.584Z',
    serial_number: 3448,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 200,
    priority_label: 'Amber',
    attributes: {},
    comment: null,
    title: 'nam itaque et',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T09:12:37.584Z',
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [
                  69.35742941331213,
                  -5.387410500528965
                ],
                [
                  69.47323234743004,
                  -5.019665619668845
                ],
                [
                  69.90982670898086,
                  -4.904904460134057
                ],
                [
                  69.45680690279613,
                  -5.962741051082247
                ],
                [
                  69.35742941331213,
                  -5.387410500528965
                ]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                67.1555441458282,
                13.763230930181122
              ],
              [
                66.65037668572187,
                14.296686922529867
              ],
              [
                68.01012959047013,
                14.576458471041452
              ],
              [
                67.60379570630441,
                13.47923752604193
              ],
              [
                67.68879369109122,
                14.960117627380354
              ],
              [
                66.55141411021768,
                13.932304405899783
              ]
            ]
          }
        }
      ]
    },
    patrol_segments: [],
    updated_at: '2022-08-09T09:12:37.584Z',
    created_at: '2022-08-09T09:12:37.584Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/2dbe4370-264f-4139-abf0-10c12b78cdcd',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '6e50ced9-e758-4899-af7f-b694b1fb2f94',
    is_collection: false,
    location: {
      latitude: -58.8063,
      longitude: 167.1397
    },
    time: '2022-08-09T14:59:22.615Z',
    serial_number: 29157,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 0,
    priority_label: 'Gray',
    attributes: {},
    comment: null,
    title: 'sunt quo rerum',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T14:59:22.615Z',
    geojson: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          167.1397,
          -58.8063
        ]
      },
      properties: {
        image: null
      }
    },
    patrol_segments: [],
    updated_at: '2022-08-09T14:59:22.615Z',
    created_at: '2022-08-09T14:59:22.615Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/6e50ced9-e758-4899-af7f-b694b1fb2f94',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  },
  {
    id: '074d5aef-ad12-4ebb-a793-86b1b7e58de8',
    is_collection: false,
    location: {
      latitude: -64.8782,
      longitude: 9.8934
    },
    time: '2022-08-09T15:20:38.255Z',
    serial_number: 71433,
    message: '',
    provenance: '',
    event_type: 'carcass_rep',
    priority: 100,
    priority_label: 'Green',
    attributes: {},
    comment: null,
    title: 'accusamus exercitationem ipsam',
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: '2022-08-09T15:20:38.255Z',
    geojson: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          9.8934,
          -64.8782
        ]
      },
      properties: {
        image: null
      }
    },
    patrol_segments: [],
    updated_at: '2022-08-09T15:20:38.255Z',
    created_at: '2022-08-09T15:20:38.255Z',
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: '/api/v1.0/activity/event/074d5aef-ad12-4ebb-a793-86b1b7e58de8',
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: []
  }
];