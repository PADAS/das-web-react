// Ropeless buoy subject with all properties populated
export const ropelessBuoySubject = {
  content_type: 'observations.subject',
  id: 'buoy-001-test-id',
  name: 'Buoy Alpha',
  title: 'Buoy Alpha Title',
  subject_type: 'device',
  subject_subtype: 'ropeless_buoy_gearset',
  common_name: null,
  additional: {
    manufacturer: 'EdgeTech',
    display_id: 'ET-2024-001'
  },
  created_at: '2024-01-15T10:00:00.000000-08:00',
  updated_at: '2024-01-20T14:30:00.000000-08:00',
  is_active: true,
  tracks_available: true,
  image_url: '/static/buoy-marker.svg',
  last_position_status: {
    last_voice_call_start_at: null,
    radio_state_at: '2024-01-20T14:30:00+00:00',
    radio_state: 'online'
  },
  last_position_date: '2024-01-20T14:30:00+00:00',
  device_status_properties: [
    { label: 'serialNumber', units: '', value: 'SN-12345-BUOY' },
    { label: 'batteryLevel', units: '%', value: '87' },
    { label: 'depth', units: 'm', value: '45' }
  ],
  last_position: {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-70.123456, 42.987654]
    },
    properties: {
      title: 'Buoy Alpha',
      subject_type: 'device',
      subject_subtype: 'ropeless_buoy_gearset',
      id: 'buoy-001-test-id',
      stroke: '#00AAFF',
      'stroke-opacity': 1,
      'stroke-width': 2,
      image: 'https://example.com/static/buoy-marker.svg',
      coordinateProperties: {
        time: '2024-01-20T14:30:00+00:00'
      },
      DateTime: '2024-01-20T14:30:00+00:00'
    }
  },
  url: 'https://example.com/api/v1.0/subject/buoy-001-test-id'
};

// Ropeless buoy subject with only manufacturer (no display_id)
export const ropelessBuoySubjectManufacturerOnly = {
  ...ropelessBuoySubject,
  id: 'buoy-002-test-id',
  name: 'Buoy Beta',
  additional: {
    manufacturer: 'SMELTS',
    display_id: ''
  }
};

// Ropeless buoy subject with only display_id (no manufacturer)
export const ropelessBuoySubjectDisplayIdOnly = {
  ...ropelessBuoySubject,
  id: 'buoy-003-test-id',
  name: 'Buoy Gamma',
  additional: {
    manufacturer: '',
    display_id: 'DID-9999'
  }
};

// Ropeless buoy subject with neither manufacturer nor display_id
export const ropelessBuoySubjectNoAdditional = {
  ...ropelessBuoySubject,
  id: 'buoy-004-test-id',
  name: 'Buoy Delta',
  additional: {}
};

// Ropeless buoy subject without serialNumber in device_status_properties
export const ropelessBuoySubjectNoSerialNumber = {
  ...ropelessBuoySubject,
  id: 'buoy-005-test-id',
  name: 'Buoy Epsilon',
  device_status_properties: [
    { label: 'batteryLevel', units: '%', value: '87' }
  ]
};

// Ropeless buoy subject with empty device_status_properties
export const ropelessBuoySubjectEmptyDeviceProps = {
  ...ropelessBuoySubject,
  id: 'buoy-006-test-id',
  name: 'Buoy Zeta',
  device_status_properties: []
};

// Ropeless buoy subject with null device_status_properties
export const ropelessBuoySubjectNullDeviceProps = {
  ...ropelessBuoySubject,
  id: 'buoy-007-test-id',
  name: 'Buoy Eta',
  device_status_properties: null
};

// Non-buoy subject for comparison testing
export const nonBuoySubject = {
  content_type: 'observations.subject',
  id: 'wildlife-001-test-id',
  name: 'Test Whale',
  subject_type: 'wildlife',
  subject_subtype: 'whale',
  device_status_properties: [
    { label: 'serialNumber', units: '', value: 'WHALE-SN-001' }
  ]
};

// GeoJSON feature for ropeless buoy (for map layer tests)
export const ropelessBuoyFeature = {
  type: 'Feature',
  properties: {
    ...ropelessBuoySubject,
    content_type: 'observations.subject'
  },
  geometry: {
    type: 'Point',
    coordinates: [-70.123456, 42.987654]
  }
};

// Feature collection with multiple buoys
export const ropelessBuoyFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    ropelessBuoyFeature,
    {
      ...ropelessBuoyFeature,
      properties: {
        ...ropelessBuoySubjectManufacturerOnly,
        content_type: 'observations.subject'
      }
    },
    {
      type: 'Feature',
      properties: {
        ...nonBuoySubject,
        content_type: 'observations.subject'
      },
      geometry: {
        type: 'Point',
        coordinates: [-71.0, 43.0]
      }
    }
  ]
};

// Track data for ropeless buoy
export const ropelessBuoyTrackData = {
  track: {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-70.123456, 42.987654],
          [-70.124000, 42.988000],
          [-70.125000, 42.989000],
          [-70.126000, 42.990000]
        ]
      },
      properties: {
        id: 'buoy-001-test-id',
        stroke: '#00AAFF',
        'stroke-width': 2,
        coordinateProperties: {
          times: [
            '2024-01-20T10:00:00+00:00',
            '2024-01-20T11:00:00+00:00',
            '2024-01-20T12:00:00+00:00',
            '2024-01-20T14:30:00+00:00'
          ]
        }
      }
    }]
  },
  points: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-70.123456, 42.987654] },
        properties: { index: 0, bearing: 45, time: '2024-01-20T10:00:00+00:00' }
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-70.124000, 42.988000] },
        properties: { index: 1, bearing: 50, time: '2024-01-20T11:00:00+00:00' }
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-70.125000, 42.989000] },
        properties: { index: 2, bearing: 55, time: '2024-01-20T12:00:00+00:00' }
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-70.126000, 42.990000] },
        properties: { index: 3, bearing: 60, time: '2024-01-20T14:30:00+00:00' }
      }
    ]
  },
  trackSegments: []
};

// Subject store containing buoy subjects
export const ropelessBuoySubjectStore = {
  'buoy-001-test-id': ropelessBuoySubject,
  'buoy-002-test-id': ropelessBuoySubjectManufacturerOnly,
  'buoy-003-test-id': ropelessBuoySubjectDisplayIdOnly,
  'buoy-004-test-id': ropelessBuoySubjectNoAdditional,
  'wildlife-001-test-id': nonBuoySubject
};

// Subject groups containing buoy subjects (for auto-pin tests)
export const subjectGroupsWithBuoys = [
  {
    id: 'group-1',
    name: 'Fishing Gear',
    subjects: [
      ropelessBuoySubject,
      ropelessBuoySubjectManufacturerOnly
    ],
    subgroups: []
  },
  {
    id: 'group-2',
    name: 'Wildlife',
    subjects: [nonBuoySubject],
    subgroups: []
  }
];

// API response mock for fetchMapSubjects
export const mockMapSubjectsApiResponse = {
  data: {
    data: [
      ropelessBuoySubject,
      ropelessBuoySubjectManufacturerOnly,
      nonBuoySubject
    ]
  }
};

// API response mock for fetchSubjectGroups
export const mockSubjectGroupsApiResponse = {
  data: {
    data: subjectGroupsWithBuoys
  }
};
