import format from 'date-fns/format';

import { store } from '../';

import { addImageToMapIfNecessary } from '../ducks/map-images';

import { feature, featureCollection, polygon } from '@turf/helpers';
import { LngLatBounds } from 'mapbox-gl';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { MAP_ICON_SIZE, MAP_ICON_SCALE, FIT_TO_BOUNDS_PADDING } from '../constants';
import { formatEventSymbolDate } from '../utils/datetime';
import { fileNameFromPath } from './string';
import { imgElFromSrc } from './img';

export const addIconToGeoJson = (geojson) => {
  const { properties: { image } } = geojson;
  if (geojson.properties.icon_id) return geojson;

  if (image) {
    geojson.properties.icon_id = fileNameFromPath(image);
  }
  return geojson;
};

export const copyResourcePropertiesToGeoJsonByKey = (item, key) => {
  const clone = { ...item };
  const clone2 = { ...item };
  delete clone2[key];
  return {
    ...clone,
    [key]: {
      ...clone[key],
      properties: {
        ...clone2,
        ...clone[key].properties,
      },
    },
  };
};

export const addMapImage = async (src, id) => {
  const icon_id = id || src;
  const img = await imgElFromSrc(src, (MAP_ICON_SIZE * MAP_ICON_SCALE));
  store.dispatch(addImageToMapIfNecessary({ icon_id, image: img }));
  return {
    icon_id,
    img,
  };
};

export const addFeatureCollectionImagesToMap = (collection, map) => {
  const { features } = collection;

  const images = features
    .filter(({ properties: { image } }) => !!image)
    .map(({ properties: { image } }) => image)
    .filter((image, index, array) => !map.hasImage(image) && (array.findIndex(item => item === image) === index))
    .map(image => addMapImage(image));

  return Promise.all(images).then(results => results);
};

const addIdToCollectionItemsGeoJsonByKey = (collection, key) => collection.map((item) => {
  item[key] = item[key] || {};
  item[key].properties = item[key].properties || {};
  item[key].properties.id = item.id;
  return item;
});

export const filterInactiveRadiosFromCollection = (subjects) => {
  if (subjects && subjects.features.length) {
    return featureCollection(subjects.features.filter( (subject) => subject.properties.radio_state !== 'offline'));
  }
  return featureCollection([]);
};

const addTitleWithDateToGeoJson = (geojson, title) => { 
  const displayTitle = geojson.properties.datetime ? title + '\n' + formatEventSymbolDate(geojson.properties.datetime) : title;
  return (geojson.properties.display_title = displayTitle) && geojson;
};

const setUpEventGeoJson = (events, eventTypes) => 
  addIdToCollectionItemsGeoJsonByKey(events, 'geojson').map(event => 
    copyResourcePropertiesToGeoJsonByKey(event, 'geojson')).map(({ geojson, title, event_type }) => {
    const displayTitle = title ||
      eventTypes.findIndex(item => item.value === event_type) > -1
      ? eventTypes.find(item => item.value === event_type).display
      : event_type;
    return addTitleWithDateToGeoJson(addIconToGeoJson(geojson), displayTitle);
  }
  );
const setUpSubjectGeoJson = subjects => addIdToCollectionItemsGeoJsonByKey(subjects, 'last_position').map(subject => copyResourcePropertiesToGeoJsonByKey(subject, 'last_position')).map(({ last_position: geojson }) => addIconToGeoJson(geojson));
const featureCollectionFromGeoJson = geojson_collection => featureCollection(geojson_collection.map(({ geometry, properties }) => feature(geometry, properties)));

export const createFeatureCollectionFromSubjects = subjects => featureCollectionFromGeoJson(setUpSubjectGeoJson(subjects));
export const createFeatureCollectionFromEvents = (events, eventTypes) => featureCollectionFromGeoJson(setUpEventGeoJson(events, eventTypes));

export const pointIsInMapBounds = (coords, map) => {
  const bounds = map.getBounds();
  const boundsGeometry = polygon([
    [
      [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
      [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
      [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
      [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
      [bounds.getNorthWest().lng, bounds.getNorthWest().lat]
    ]
  ]);
  return booleanPointInPolygon(coords, boundsGeometry);
};

export const generateBoundsForLineString = ({ geometry }) => {
  return geometry.coordinates.reduce((bounds, coords) => bounds.extend(coords), new LngLatBounds());
};

export const jumpToLocation = (map, coords, zoom = 17) => {

  
  if (!Array.isArray(coords[0])) {
    map.setZoom(zoom);
  }

  if (Array.isArray(coords[0])) {
    if (coords.length > 1) {

      const boundaries = coords.reduce((bounds, coords) => bounds.extend(coords), new LngLatBounds());
      map.fitBounds(boundaries, {
        linear: true,
        speed: 200,
        padding: FIT_TO_BOUNDS_PADDING,
      });
    } else {
      map.easeTo({
        center: coords[0],
        zoom,
        speed: 200,
      });
    }
  } else {
    map.easeTo({
      center: coords,
      zoom,
      speed: 200,
    });
  };
};

/* react-mapbox-gl generates layer names for the GeoJsonLayer component by appending them with `-<layertype>`, such as `-fill` or `-circle`. 
this is a utility for identifying those layers by name programmatically when required. */
export const calcLayerName = (key, name) => {
  if (key.includes('_FILLS')) return `${name}-fill`;
  if (key.includes('_SYMBOL')) return `${name}-symbol`;
  if (key.includes('_LINES')) return `${name}-line`;
  if (key.includes('_CIRCLES')) return `${name}-circle`;
  return name;
};


/* mapbox-gl doesn't parse + store null/undefined values correctly in its symbol layer's geojson properties, so you have to `string.replace` them here when accessing via event handlers.
unfortunately that means that you can't have the strings "null" or "undefined" set as field values, but that's quite an edge case anyway. hopefully we can remove this code in the future. */
export const cleanUpBadlyStoredValuesFromMapSymbolLayer = (object) => {

  const valueIsJson = value => typeof value === 'string' && (value.startsWith('{') || value.startsWith('['));

  const updates = Object.entries(object).reduce((accumulator, [key, value]) => {
    if (value === 'null') accumulator[key] = null;
    if (value === 'undefined') accumulator[key] = undefined;
    if (valueIsJson(value)) {
      const newValue = JSON.parse(value);
      if (Array.isArray(newValue)) {
        accumulator[key] = newValue;
      } else {
        accumulator[key] = cleanUpBadlyStoredValuesFromMapSymbolLayer(newValue);
      }
    }

    return accumulator;
  }, {});
  return {
    ...object,
    ...updates,
  };
};

export const bindMapClickFunction = (map, fn) => map.on('click', fn);
export const unbindMapClickFunction = (map, fn) => map.off('click', fn);

export const lockMap = (map, isLocked) => {
  const mapControls = ['boxZoom', 'scrollZoom', 'dragPan', 'dragRotate', 'touchZoomRotate', 'touchZoomRotate', 'doubleClickZoom', 'keyboard'];
  if (isLocked === true) {
    mapControls.forEach(function (control) {
      map[control].disable();
    });
  }
  else {
    mapControls.forEach(function (control) {
      map[control].enable();
    });
  }
};

const baseLayerIsArcGisServer = ({ attributes: { url } }) => url.includes('arcgisonline.com/ArcGIS/rest/services');
const baseLayerIsGoogleMap = ({ attributes: { url } }) => url.includes('mt.google.com');

const fetchAttributionForArcGisServer = ({ attributes: { url } } ) => {
  const attributionUrl = `${url.substring(0, url.lastIndexOf('MapServer') + 9)}?f=pjson`;
  return window.fetch(attributionUrl)
    .then((response) => response.json())
    .then((json) => json.copyrightText)
    .catch((error) => 'Error fetching map attribution');
};

export const getAttributionStringForBaseLayer = (baseLayer) => {
  const currentDate = format(new Date(), 'YYYY');
  if (baseLayer.attributes.attribution) return Promise.resolve(baseLayer.attributes.attribution);
  if (baseLayerIsArcGisServer(baseLayer)) return fetchAttributionForArcGisServer(baseLayer);
  if (baseLayerIsGoogleMap(baseLayer)) return Promise.resolve(`©${currentDate} Google`);
  return Promise.resolve(`©${currentDate} Mapbox ©${currentDate} OpenStreetMap`);
};

export const metersToPixelsAtMaxZoom = (meters, latitude) =>
  // 0.20115532905502917 is for a max zoom of 18,
  // use the code snippet below to change this formula if our MAX_ZOOM configuration changes
  (meters / 0.20115532905502917) / Math.cos(latitude * Math.PI / 180);

/* const getPixelsPerMeterAtMaxZoom = (map) => {
  map.setZoom(MAX_ZOOM);
  const maxWidth = 100;

  const getDistance = (latlng1, latlng2) => {
    // Uses spherical law of cosines approximation.
    const R = 6371000;

    const rad = Math.PI / 180,
      lat1 = latlng1.lat * rad,
      lat2 = latlng2.lat * rad,
      a = Math.sin(lat1) * Math.sin(lat2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.cos((latlng2.lng - latlng1.lng) * rad);

    const maxMeters = R * Math.acos(Math.min(a, 1));
    return maxMeters;

  };

  const y = map._container.clientHeight / 2;
  const maxMeters = getDistance(map.unproject([0, y]), map.unproject([maxWidth, y]));

  return maxMeters / maxWidth;
}; */


/* 
CANCEL MAPBOX ZOOM PROGRMAMATICALLY

Unfortunately there’s no public Mapbox method to cancel a camera movement, but you can change the zoom level to trigger a halt.
map.setZoom(map.getZoom() + 0.01);
*/

export const metersPerPixel = (lat, zoom) => {
  var earthCircumference = 40075017;
  var latitudeRadians = lat * (Math.PI/180);
  return earthCircumference * Math.cos(latitudeRadians) / Math.pow(2, zoom + 8);
};
