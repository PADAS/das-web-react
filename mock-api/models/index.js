const faker = require('faker/locale/en');
const utils = require('../utils');

const priorities = [0,100,200,300];
const patrolStates = ['upcoming', 'active', 'past', 'cancelled'];
// const segmentStates = ['created', 'active', 'finished'];
const patrolTypes = ['patrol1', 'patrol2', 'patrol3', 'patrol4', 'patrol5'];

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
  priority: randomItemFromArray(priorities), // not for MVP
  // state: randomItemFromArray(segmentStates), // ? we should define these,
  leader: null,
  scheduled_start: randomItemFromArray([faker.date.future(), faker.date.recent()]),
  time_range: {
    start_time: generateSegmentStartTime(),
    end_time: generateSegmentEndTime(),
  },
  start_location: randomItemFromArray(patrolStartLocations),
  end_location: randomItemFromArray(patrolEndLocations), 
  // icon_id: String (url to image resource),
  image_url: null,
  // members: Array <Member>, // not for MVP,
  // targets:  Array <Targets>, // not for MVP,
  // leader: Object (Member), // not for MVP,
  reports: [],
});

const generatePatrol = () => {
  const patrol = {
    id: faker.random.uuid(),
    serial_number: faker.random.number(),
    priority: randomItemFromArray(priorities),
    title: faker.random.words(2),
    notes: [],
    state: randomItemFromArray(patrolStates), // ? we should define these,
    files: [],
    updated_at: faker.date.recent(),
    created_at: faker.date.recent(),
    updates: [],
  };

  patrol.patrol_segments = [generatePatrolSegment(patrol)];

  return patrol;
};

module.exports = {
  generatePatrol,
  generatePatrolSegment,
};