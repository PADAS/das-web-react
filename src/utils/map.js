import { feature, featureCollection } from '@turf/helpers';
import { fileNameFromPath } from './string';
import { svgSrcToPngImg } from './img';
import { MAP_ICON_SIZE } from '../constants';

const addIconToGeoJson = (geojson) => {
  const { properties: { image } } = geojson;
  if (image) {
    geojson.properties.icon_id = fileNameFromPath(image);
  }
  return geojson;
};

const copyResourcePropertiesToGeoJsonByKey = (item, key) => {
  const clone = { ...item };
  const clone2 = { ...item };
  delete clone2[key];
  clone[key].properties = { ...clone2, ...clone[key].properties };
  return clone;
};

export const addFeatureCollectionImagesToMap = async (collection, map) => {
  const { features } = collection;
  const mapImageIDs = map.listImages();

  const images = features
    .filter(({ properties: { image } }) => !!image)
    .map(({ properties: { image, icon_id } }) => ({ icon_id, image }))
    .filter(({ icon_id }, index, array) => !mapImageIDs.includes(icon_id) && (array.findIndex(item => item.icon_id === icon_id) === index))
    .map(({ image, icon_id }) => svgSrcToPngImg(image, MAP_ICON_SIZE)
      .then((img) => {
        if (!map.hasImage(icon_id)) map.addImage(icon_id, img);
        return img;
      }));

  const results = await Promise.all(images);
  return results;
};

const addIdToCollectionItemsGeoJsonByKey = (collection, key) => collection.map(item => (item[key].properties.id = item.id) && item);
const addTitleToGeoJson = (geojson, title) => (geojson.properties.display_title = title) && geojson;

const setUpEventGeoJson = events => addIdToCollectionItemsGeoJsonByKey(events, 'geojson').map(event => copyResourcePropertiesToGeoJsonByKey(event, 'geojson')).map(({ geojson, title, event_type }) => addTitleToGeoJson(addIconToGeoJson(geojson), title || event_type));
const setUpSubjectGeoJson = subjects => addIdToCollectionItemsGeoJsonByKey(subjects, 'last_position').map(subject => copyResourcePropertiesToGeoJsonByKey(subject, 'last_position')).map(({ last_position: geojson }) => addIconToGeoJson(geojson));
const featureCollectionFromGeoJson = geojson_collection => featureCollection(geojson_collection.map(({ geometry, properties }) => feature(geometry, properties)));

export const createFeatureCollectionFromSubjects = subjects => featureCollectionFromGeoJson(setUpSubjectGeoJson(subjects));
export const createFeatureCollectionFromEvents = events => featureCollectionFromGeoJson(setUpEventGeoJson(events));