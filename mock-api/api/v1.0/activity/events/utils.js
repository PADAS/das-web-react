const { faker } = require('@faker-js/faker');
const { featureCollection, polygon, rewind } =  require('@turf/turf');

const generateArrayofCoordinatePairs = (length = 5) => {
  const baseLat = Number.parseFloat(faker.location.latitude()) / 2;
  const baseLon = Number.parseFloat(faker.location.longitude()) / 2;

  const getRandomBetweenMinusOneAndOne = () => Math.random() * (Math.random() > 0.5 ? 1 : -1);

  return Array.from({ length }, () =>
    [baseLon + getRandomBetweenMinusOneAndOne(), baseLat + getRandomBetweenMinusOneAndOne()]
  );
};

const createPolygonFeatureCollection = () => {
  const numberOfPolygons = 1; // change this to randomInteger() when you want to support multi-feature featurecollections for the geometry prop

  const polygonCoordinateSets = Array.from({ length: numberOfPolygons }, () => {
    let coordinates = generateArrayofCoordinatePairs(faker.number.int({ max: 8, min: 4 }));
    coordinates = [[...coordinates, coordinates[0]]]; /* close the polygon by adding a final point identical to the first */

    return coordinates;
  });

  return createFeatureCollectionOfGeometryTypeFromCoords(polygonCoordinateSets);
};

const createFeatureCollectionOfGeometryTypeFromCoords = (arrayOfCoords = [], geometryType = polygon) =>
  featureCollection(
    arrayOfCoords.map(coords =>
      rewind(
        geometryType(coords, { datetime: new Date().toISOString() })
      )
    )
  );

const geometryOptions = [createPolygonFeatureCollection, null];
const priorityOptions = [
  { value: 0, label: 'Gray' },
  { value: 100, label: 'Green' },
  { value: 200, label: 'Amber' },
  { value: 300, label: 'Red' },
];

const generateEvent = (override) => {
  const geometry = faker.helpers.arrayElement(geometryOptions)?.();

  const location = !!geometry ? null : {
    latitude: Number.parseFloat(faker.location.latitude()),
    longitude: Number.parseFloat(faker.location.longitude()),
  };

  const priority = faker.helpers.arrayElement(priorityOptions);
  const timestamp = faker.date.recent();
  const id = faker.string.uuid();

  return {
    id,
    is_collection: false,
    geometry,
    location,
    time: timestamp,
    serial_number: faker.number.int(),
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

module.exports = { generateEvent };
