import { featureCollection } from '@turf/turf';

import store from '../store';
import { addImageToMapIfNecessary } from '../ducks/map-images';
import { MAP_ICON_SIZE, MAP_ICON_SCALE, TIME_OF_DAY_LINE_COLOR_FALLBACK, TIME_OF_DAY_PERIODS } from '../constants';
import { format, formatEventSymbolDate } from './datetime';
import { imgElFromSrc, calcUrlForImage, calcImgIdFromUrlForMapImages } from './img';

const addItemPropsToFeatureByKey = (item, feature, key) => {
  const toDelete = ['geojson', 'location', 'geometry', key];
  const clone = { ...item };
  toDelete.forEach((item) => delete clone[item]);

  return {
    ...feature,
    properties: {
      ...clone,
      ...feature.properties,
      id: clone?.id ?? feature?.properties?.id, // preserving original ID in case of integration interference
    },
  };
};

export const addPropsToGeoJsonByKey = (item, key) => {
  if (!item[key]) return item;

  const isCollection = item[key].type === 'FeatureCollection';

  if (isCollection) {
    return {
      ...item,
      [key]: {
        ...item[key],
        features: item[key].features.map((feature => addItemPropsToFeatureByKey(item, feature, key)))
      }
    };
  }

  return {
    ...item,
    [key]: addItemPropsToFeatureByKey(item, item[key], key),
  };
};



export const waitForMapBounds = (map, MAX_TIMEOUT = 1000, INTERVAL_LENGTH = 125) => new Promise((resolve, reject) => {
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

export const addFeatureCollectionImagesToMap = (collection, options = {}, map = null) => {
  const { features } = collection;

  const images = features
    .filter(({ properties: { image } }) => !!image)
    .map(({ properties }) => properties)
    .filter((properties, index, array) =>  array.findIndex(item => item.image === properties.image) === index)
    .filter((properties) => {
      if (!map) return !!properties;
      return !!map.hasImage(calcImgIdFromUrlForMapImages(properties.image, properties.width, properties.height));
    })
    .map(properties => addMapImage({ src: properties.image, height: properties.height, width: properties.width, options }));

  return Promise.all(images).then(results => results);
};

export const addTitleWithDateToGeoJson = (geojson, title) => {
  const addTitle = (feature) => {
    const displayTitle = feature.properties.time ? title + '\n' + formatEventSymbolDate(feature.properties.time) : title;
    return (feature.properties.display_title = displayTitle) && feature;
  };

  if (geojson.type === 'FeatureCollection') {
    return {
      ...geojson,
      features: geojson.features.map(feature => addTitle(feature)),
    };
  }
  return addTitle(geojson);
};

const setUpEventGeoJson = (events, eventTypes) => {
  const key = 'geojson';

  return events
    .filter (event => !!event[key])
    .map(event => {
      const key = 'geojson';

      const withProps = addPropsToGeoJsonByKey(event, key);
      let displayTitle = withProps.title || getEventTypeTitle(eventTypes, withProps.event_type);
      if (event.locallyEdited) {
        displayTitle = `* ${displayTitle}`;
      }

      return addTitleWithDateToGeoJson(withProps[key], displayTitle);
    });
};

export const getEventTypeTitle = (event_types, event_type) => {
  const typeTitle = event_types.findIndex(item => item.value === event_type) > -1
    ? event_types.find(item => item.value === event_type)
    : event_type;
  return (typeTitle && typeTitle.display) ? typeTitle.display : typeTitle;
};

export const featureCollectionFromGeoJson = geojson_array => {
  const flattened = geojson_array.reduce((array, item) => {
    if (item.type === 'FeatureCollection') {
      return [
        ...array,
        ...item.features
      ];
    }
    return [
      ...array,
      item
    ];
  }, []);

  return featureCollection(flattened);
};

export const createFeatureCollectionFromEvents = (events, eventTypes) =>
  featureCollectionFromGeoJson(
    setUpEventGeoJson(events, eventTypes)
  );

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

export const calculatePopoverPlacement = async (map, popoverLocation) => {
  if (!map || !popoverLocation) return 'auto';

  const SIDE_EDGES_NEARNESS_PERCENTAGE_THRESHOLD = 0.8;
  const BOTTOM_EDGE_NEARNESS_PERCENTAGE_THRESHOLD = 0.55;

  const mapBounds = await waitForMapBounds(map);
  const mapRelativeWidth = mapBounds._ne.lng - mapBounds._sw.lng;
  const mapRelativeHeight = mapBounds._sw.lat - mapBounds._ne.lat;
  const popoverRelativeCoordinateX = popoverLocation.lng - mapBounds._sw.lng;
  const popoverRelativeCoordinateY = popoverLocation.lat - mapBounds._ne.lat;

  const popoverXPlacementRatio = popoverRelativeCoordinateX / mapRelativeWidth;
  const popoverYPlacementRatio = popoverRelativeCoordinateY / mapRelativeHeight;

  if (popoverXPlacementRatio > SIDE_EDGES_NEARNESS_PERCENTAGE_THRESHOLD) {
    return 'left';
  }
  if ((1 - popoverXPlacementRatio) > SIDE_EDGES_NEARNESS_PERCENTAGE_THRESHOLD) {
    return 'right';
  }
  if (popoverYPlacementRatio > BOTTOM_EDGE_NEARNESS_PERCENTAGE_THRESHOLD) {
    return 'top';
  }
  return 'bottom';
};


export const safeRemoveMapLayer = (map, layerId) => {
  if (!map) return;
  try {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  } catch (error) {
    console.error(`error removing layer ${layerId} from map`, error);
  }
};

/** Mapbox `line-color` expression from an ISO datetime property and `TIME_OF_DAY_PERIODS` (see constants). */
export const getTimeOfDayLineColorExpression = (propertyName, fallbackExpression, timeZoneOffsetMinutes = 0) => {
  // Parse UTC hour and minute from ISO string (indices 11-12 = HH, 14-15 = MM)
  const hourExpr = ['to-number', ['slice', ['get', propertyName], 11, 13]];
  const minuteExpr = ['to-number', ['slice', ['get', propertyName], 14, 16]];
  const utcMinutesSinceMidnight = ['+', ['*', hourExpr, 60], minuteExpr];
  // Localize: localMinutes = (utcMinutes + offset + 4320) % 1440 (4320 ensures positive before mod)
  const localMinutesSinceMidnight = ['%', ['+', utcMinutesSinceMidnight, timeZoneOffsetMinutes, 4320], 1440];

  const periodBranches = TIME_OF_DAY_PERIODS.flatMap(({ rangeMinutesMin, rangeMinutesMax, color }) => [
    ['all', ['>=', localMinutesSinceMidnight, rangeMinutesMin], ['<=', localMinutesSinceMidnight, rangeMinutesMax]],
    color,
  ]);

  return [
    'case',
    ['all', ['has', propertyName], ['!=', ['get', propertyName], '']],
    ['case', ...periodBranches, TIME_OF_DAY_LINE_COLOR_FALLBACK],
    fallbackExpression,
  ];
};
export const buildGeoSpanFilter = (geoSpan) => {
  if (!geoSpan) return null;

  const { lon, lat } = geoSpan;

  if (!Array.isArray(lon) || !Array.isArray(lat) || lon.length < 2 || lat.length < 2) {
    return null;
  }

  const [lon1, lon2] = lon;
  const [lat1, lat2] = lat;

  if (
    !Number.isFinite(lon1) ||
    !Number.isFinite(lon2) ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lat2)
  ) {
    return null;
  }

  const minLon = Math.min(lon1, lon2);
  const maxLon = Math.max(lon1, lon2);
  const minLat = Math.min(lat1, lat2);
  const maxLat = Math.max(lat1, lat2);
  return [minLon, minLat, maxLon, maxLat];
};

export const safeRemoveMapSource = (map, sourceId) => {
  if (!map?.getSource?.(sourceId)) return;
  try {
    map.removeSource(sourceId);
  } catch (error) {
    // A shared source may still be referenced by another layer mid-teardown.
    console.error(`error removing source ${sourceId} from map`, error);
  }
};

