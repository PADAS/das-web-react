import { feature, featureCollection, polygon } from '@turf/helpers';
import { LngLatBounds } from 'mapbox-gl';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import format from 'date-fns/format';


import store from '../store';

import { addImageToMapIfNecessary } from '../ducks/map-images';

import { MAP_ICON_SIZE, MAP_ICON_SCALE, FIT_TO_BOUNDS_PADDING } from '../constants';
import { formatEventSymbolDate } from '../utils/datetime';
import { imgElFromSrc, calcUrlForImage, calcImgIdFromUrlForMapImages } from './img';


export const waitForMapBounds = (map, MAX_TIMEOUT = 3000, INTERVAL_LENGTH = 125) => new Promise((resolve, reject) => {
  let timeoutRemaining = MAX_TIMEOUT;

  const tryToGetMapBounds = () => {
    try {
      const bounds = map.getBounds();
      window.clearInterval(interval);
      resolve(bounds);
    } catch (error) {
      if (timeoutRemaining < INTERVAL_LENGTH) {
        window.clearInterval(interval);
        return reject(error);
      }
    }
  };

  tryToGetMapBounds();

  const interval = window.setInterval(() => {
    timeoutRemaining = (timeoutRemaining-INTERVAL_LENGTH);
    tryToGetMapBounds();
  }, [INTERVAL_LENGTH]);
});


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

export const addMapImage = async ({ src, id, height, width, options = {} }) => {
  const iconSrc = calcUrlForImage(src);
  const icon_id = id ? id : calcImgIdFromUrlForMapImages(src, width, height);
  const img = await imgElFromSrc(
    iconSrc,
    (width ? (width * MAP_ICON_SCALE) : (MAP_ICON_SIZE * MAP_ICON_SCALE)),
    (height && (height * MAP_ICON_SCALE)),
  );
  store.dispatch(addImageToMapIfNecessary({ icon_id, image: img }, options));
  return {
    icon_id,
    img,
  };
};

export const addFeatureCollectionImagesToMap = (collection) => {
  const { features } = collection;

  const images = features
    .filter(({ properties: { image } }) => !!image)
    .map(({ properties }) => properties)
    .filter((properties, index, array) =>  array.findIndex(item => item.image === properties.image) === index)
    .map(properties => addMapImage({ src: properties.image, height: properties.height, width: properties.width }));

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

export const addTitleWithDateToGeoJson = (geojson, title) => {
  const displayTitle = geojson.properties.datetime ? title + '\n' + formatEventSymbolDate(geojson.properties.datetime) : title;
  return (geojson.properties.display_title = displayTitle) && geojson;
};

const setUpEventGeoJson = (events, eventTypes) =>
  addIdToCollectionItemsGeoJsonByKey(events, 'geojson').map(event =>
    copyResourcePropertiesToGeoJsonByKey(event, 'geojson')).map(({ geojson, title, event_type }) => {
    const displayTitle = title || getEventTypeTitle(eventTypes, event_type);
    return addTitleWithDateToGeoJson(geojson, displayTitle);
  }
  );

export const getEventTypeTitle = (event_types, event_type) => {
  const typeTitle = event_types.findIndex(item => item.value === event_type) > -1
    ? event_types.find(item => item.value === event_type)
    : event_type;
  return (typeTitle && typeTitle.display) ? typeTitle.display : typeTitle;
};

const setUpSubjectGeoJson = subjects =>
  addIdToCollectionItemsGeoJsonByKey(subjects, 'last_position')
    .map(subject =>
      copyResourcePropertiesToGeoJsonByKey(subject, 'last_position')
    )
    .map(({ last_position: geojson }) =>
      geojson
    );

const featureCollectionFromGeoJson = geojson_collection =>
  featureCollection(
    geojson_collection
      .filter(({ geometry, properties }) => !!geometry && !!properties)
      .map(({ geometry, properties }) =>
        feature(geometry, properties)
      )
  );

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

export const jumpToLocation = (map, coords, zoom = 15) => {
  if (!Array.isArray(coords[0])) {
    map.setZoom(zoom);
    map.easeTo({
      center: coords,
      zoom,
      speed: 200,
    });
  } else {
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
  }
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
    .catch(() => 'Error fetching map attribution');
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

export const calculatePopoverPlacement = async (map, popoverLocation) => {
  if (!map || !popoverLocation) return 'auto';

  const EDGE_NEARNESS_PERCENTAGE_THRESHOLD = 0.7;

  const mapBounds = await waitForMapBounds(map);
  const mapRelativeWidth = mapBounds._ne.lng - mapBounds._sw.lng;
  const mapRelativeHeight = mapBounds._sw.lat - mapBounds._ne.lat;
  const popoverRelativeCoordinateX = popoverLocation.lng - mapBounds._sw.lng;
  const popoverRelativeCoordinateY = popoverLocation.lat - mapBounds._ne.lat;

  if (popoverRelativeCoordinateX / mapRelativeWidth > EDGE_NEARNESS_PERCENTAGE_THRESHOLD) {
    return 'left';
  }
  if (popoverRelativeCoordinateY / mapRelativeHeight > EDGE_NEARNESS_PERCENTAGE_THRESHOLD) {
    return 'right';
  }
  return 'auto';
};
