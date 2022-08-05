const { lineString, polygon, featureCollection } =  require('@turf/helpers');
const faker = require('faker/locale/en');

const utils = require('../utils');

const { randomItemFromArray, randomInteger } = utils;

const generateArrayofCoordinatePairs = (length = 5) =>
  Array.from({ length }, () =>
    [Number.parseFloat(faker.address.latitude()), Number.parseFloat(faker.address.longitude())]
  );


const createPolygonFeatureCollection = () => {
  const numberOfPolygons = 1; // change this to randomInteger() when you want to support multi-feature featurecollections for the geometry prop

  const polygonCoordinateSets = Array.from({ length: numberOfPolygons }, () => {
    let coordinates = generateArrayofCoordinatePairs(randomInteger(3));
    coordinates = [[...coordinates, coordinates[0]]]; /* close the polygon by adding a final point identical to the first */

    return coordinates;
  });

  return createFeatureCollectionOfGeometryTypeFromCoords(polygonCoordinateSets);
};

const createLineStringFeatureCollection = () => {
  const numberOfLineStrings = 1;

  const lineStringCoordinateSets = Array.from({ length: numberOfLineStrings }, () => generateArrayofCoordinatePairs(randomInteger(2)));

  return createFeatureCollectionOfGeometryTypeFromCoords(lineStringCoordinateSets, lineString);
};

const createMixedGeometryFeatureCollection = () => {
  const collectionOne = createPolygonFeatureCollection();
  const collectionTwo = createLineStringFeatureCollection();

  return featureCollection([...collectionOne.features, ...collectionTwo.features]);
};

const createFeatureCollectionOfGeometryTypeFromCoords = (arrayOfCoords = [], geometryType = polygon) =>
  featureCollection(
    arrayOfCoords.map(coords =>
      geometryType(coords)
    )
  );

const geometryOptions = [createPolygonFeatureCollection, createLineStringFeatureCollection, createMixedGeometryFeatureCollection, null];
const priorityOptions = [
  { value: 0, label: 'Gray' },
  { value: 100, label: 'Green' },
  { value: 200, label: 'Amber' },
  { value: 300, label: 'Red' },
];

const generateEvent = (override) => {
  const geometry = randomItemFromArray(geometryOptions)?.();

  const location = !!geometry ? null : {
    latitude: Number.parseFloat(faker.address.latitude()),
    longitude: Number.parseFloat(faker.address.longitude()),
  };

  const priority = randomItemFromArray(priorityOptions);
  const timestamp = faker.date.recent();
  const id = faker.datatype.uuid();

  return {
    id,
    is_collection: false,
    geometry,
    location,
    time: timestamp,
    serial_number: faker.datatype.number(),
    message: '',
    provenance: '',
    ...override,
    event_type: 'carcass_rep',
    priority: priority.value,
    priority_label: priority.label,
    attributes: {},
    comment: null,
    title: faker.lorem.words(3),
    notes: [],
    reported_by: null,
    state: 'active',
    contains: [],
    is_linked_to: [],
    is_contained_in: [],
    sort_at: timestamp,
    geojson: location ? {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      },
      properties: {
        image: null,
      },
    } : geometry,
    patrol_segments: [],
    updated_at: timestamp,
    created_at: timestamp,
    icon_id: 'silence_source_rep',
    event_details: {},
    files: [],
    event_category: 'analyzer_event',
    url: `/api/v1.0/activity/event/${id}`,
    image_url: 'https://develop.pamdas.org/static/generic-gray.svg',
    patrols: [],
    updates: [],
  };
};

const generateEventsList = (length = 25) => ({
  data: {
    results: Array.from({ length }, generateEvent),
    next: null,
    count: 25,
  }
});


module.exports = {
  generateEvent,
  generateEventsList,
};
