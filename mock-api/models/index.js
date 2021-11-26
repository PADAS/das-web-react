const faker = require('faker/locale/en');

const utils = require('../utils');

const priorities = [0, 100, 200, 300];
const patrolStates = ['upcoming', 'active', 'past', 'cancelled'];
const patrolTypes = ['patrol1', 'patrol2', 'patrol3', 'patrol4', 'patrol5'];

const mockSubjectValues = [
  { subject_subtype: 'antelope', subject_type: 'wildlife', image_url: '/static/antelope-black-male.svg' },
  { subject_subtype: 'boat', subject_type: 'vehicle', image_url: '/static/ranger_boat-green.svg' },
  { subject_subtype: 'camera trap', subject_type: 'stationary sensor', image_url: '/static/ranger-black.svg' },
  { subject_subtype: 'car', subject_type: 'vehicle', image_url: '/static/ranger-black.svg' },
  { subject_subtype: 'driver', subject_type: 'person', image_url: '/static/ranger-black.svg' },
  { subject_subtype: 'elephant', subject_type: 'wildlife', image_url: '/static/elephant-black-male.svg' },
  { subject_subtype: 'helicopter', subject_type: 'aircraft', image_url: '/static/helicopter-black.svg' },
  { subject_subtype: 'plane', subject_type: 'aircraft', image_url: '/static/plane-black.svg' },
  { subject_subtype: 'ranger', subject_type: 'person', image_url: '/static/ranger-black.svg' },
  { subject_subtype: 'rhino', subject_type: 'wildlife', image_url: '/static/rhino-black-male.svg' },
  { subject_subtype: 'zebra', subject_type: 'wildlife', image_url: '/static/zebra-black-male.svg' },
  { subject_subtype: 'weather_station', subject_type: 'static sensor', image_url: '/static/ranger-green.svg' },
  { subject_subtype: 'river_flow', subject_type: 'static sensor', image_url: '/static/ranger-green.svg' },
  { subject_subtype: 'fuel_tank', subject_type: 'static sensor', image_url: '/static/ranger-green.svg' },
  { subject_subtype: 'fence', subject_type: 'static sensor', image_url: '/static/ranger-green.svg' },
];

const patrolStartLocations = [
  { longitude: -122.33156202520189, latitude: 47.561758667585565 },
  { longitude: -120, latitude: 45 },
  { longitude: -119.34134, latitude: 51.222 },
];

const patrolEndLocations = [
  { longitude: -120.5, latitude: 49 },
  { longitude: -116.312312, latitude: 46.33434234 },
  { longitude: -118.4318843923, latitude: 50.0012321 },
];

const {
  generateSegmentStartTime,
  generateSegmentEndTime,
  randomItemFromArray,
} = utils;


const generatePatrolSegment = (patrol) => ({
  id: faker.random.uuid(),
  patrol: { id: patrol.id, type: patrol.type, priority: patrol.priority, state: patrol.state, title: patrol.title }, // just need: ID, type, priority, status, title, url
  patrol_type: randomItemFromArray(patrolTypes),
  priority: randomItemFromArray(priorities),
  leader: null,
  scheduled_start: randomItemFromArray([faker.date.future(), faker.date.recent()]),
  time_range: {
    start_time: generateSegmentStartTime(),
    end_time: generateSegmentEndTime(),
  },
  start_location: randomItemFromArray(patrolStartLocations),
  end_location: randomItemFromArray(patrolEndLocations),
  image_url: null,
  reports: [],
});

const generatePatrol = () => {
  const patrol = {
    id: faker.random.uuid(),
    serial_number: faker.random.number(),
    priority: randomItemFromArray(priorities),
    title: faker.random.words(2),
    notes: [],
    state: randomItemFromArray(patrolStates),
    files: [],
    updated_at: faker.date.recent(),
    created_at: faker.date.recent(),
    updates: [],
  };

  patrol.patrol_segments = [generatePatrolSegment(patrol)];

  return patrol;
};

const generateSubject = () => {
  const {
    subject_type,
    subject_subtype,
    image_url,
  } = mockSubjectValues[Math.floor(Math.random() * mockSubjectValues.length)];
  const name = `Mock ${subject_subtype} ${faker.random.number()}`;
  const id = faker.random.uuid();
  let device_status_properties = null, tracks_available = true;

  if (subject_type === 'static sensor') {
    tracks_available = false;
    device_status_properties = [{
      default: true,
      label: 'Temperature',
      units: 'ºC',
      value: '31',
    }, {
      label: 'Wind',
      units: 'kph',
      value: '12',
    }, {
      label: 'Humidity',
      units: '%',
      value: '75',
    }];
  }

  return {
    content_type: 'observations.subject',
    id,
    name: `Subject ${faker.random.number()}`,
    subject_type,
    subject_subtype,
    common_name: name,
    additional: {},
    created_at: '2021-11-10T07:26:19.869853-08:00',
    updated_at: '2021-11-10T07:26:19.869873-08:00',
    is_active: true,
    tracks_available,
    image_url,
    last_position_status: {
      last_voice_call_start_at: null,
      radio_state_at: null,
      radio_state: 'na',
    },
    last_position_date: '2021-11-10T15:19:01+00:00',
    last_position: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          -104 + Math.random(),
          20 + Math.random(),
        ],
      },
      properties: {
        title: name,
        subject_type,
        subject_subtype,
        id,
        stroke: '#FFFF00',
        'stroke-opacity': 1.0,
        'stroke-width': 2,
        image: `https://develop.pamdas.org${image_url}`,
        last_voice_call_start_at: null,
        location_requested_at: null,
        radio_state_at: '1970-01-01T00:00:00+00:00',
        radio_state: 'na',
        coordinateProperties: {
          time: '2021-11-10T15:19:01+00:00',
        },
        DateTime: '2021-11-10T15:19:01+00:00',
      },
    },
    device_status_properties,
    url: 'https://develop.pamdas.org/api/v1.0/subject/0101e852-f0e7-4555-a0d6-68184be613b8',
  };
};

module.exports = {
  generateSubject,
  generatePatrol,
  generatePatrolSegment,
};
