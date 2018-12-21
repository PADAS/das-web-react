import { feature, featureCollection } from '@turf/helpers';
import { fileNameFromPath } from './string';

const addIconToGeoJson = (geojson) => {
  const { properties: { image } } = geojson;
  if (image) {
    geojson.properties.icon_id = fileNameFromPath(image);
  }
  return geojson;
};

const copyResourcePropertiesToGeoJsonByKey = (item, key) => {
  const clone = Object.assign({}, item);
  const clone2 = Object.assign({}, item);
  delete clone2[key];
  clone[key].properties = Object.assign(clone2, clone[key].properties);
  return clone;
};

const addIdToCollectionItemsGeoJsonByKey = (collection, key) => collection.map(item => (item[key].properties.id = item.id) && item);
const addTitleToGeoJson = (geojson, title) => (geojson.properties.display_title = title) && geojson;

const setUpEventGeoJson = events => addIdToCollectionItemsGeoJsonByKey(events, 'geojson').map(event => copyResourcePropertiesToGeoJsonByKey(event, 'geojson')).map(({ geojson, title, event_type }) => addTitleToGeoJson(addIconToGeoJson(geojson), title || event_type));
const setUpSubjectGeoJson = (subjects) => addIdToCollectionItemsGeoJsonByKey(subjects, 'last_position').map(subject => copyResourcePropertiesToGeoJsonByKey(subject, 'last_position')).map(({ last_position: geojson }) => addIconToGeoJson(geojson));
const featureCollectionFromGeoJson = geojson_collection => featureCollection(geojson_collection.map(({ geometry, properties }) => feature(geometry, properties)));

export const createFeatureCollectionFromSubjects = subjects => featureCollectionFromGeoJson(setUpSubjectGeoJson(subjects));
export const createFeatureCollectionFromEvents = events => featureCollectionFromGeoJson(setUpEventGeoJson(events));