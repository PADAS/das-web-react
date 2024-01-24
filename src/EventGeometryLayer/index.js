import { useContext }  from 'react';
import { featureCollection } from '@turf/helpers';
import { MapContext } from '../App';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { getMapEventFeatureCollectionByTypeWithVirtualDate } from '../selectors/events';
import { getShowReportsOnMap } from '../selectors/clusters';
import { LAYER_IDS, SOURCE_IDS } from '../constants';
import { MAP_LOCATION_SELECTION_MODES } from '../ducks/map-ui';
import { PRIORITY_COLOR_MAP } from '../utils/events';
import { useMapEventBinding, useMapLayer, useMapSource } from '../hooks';

const { EVENT_GEOMETRY_LAYER, EVENT_SYMBOLS } = LAYER_IDS;

const { EVENT_GEOMETRY } = SOURCE_IDS;

const NO_PRIORITY_COLOR = PRIORITY_COLOR_MAP[0].base;
const LOW_PRIORITY_COLOR = PRIORITY_COLOR_MAP[100].base;
const MEDIUM_PRIORITY_COLOR = PRIORITY_COLOR_MAP[200].base;
const HIGH_PRIORITY_COLOR = PRIORITY_COLOR_MAP[300].base;

const PRIORITY_COLOR_EXPRESSION = [
  'case',
  ['==', ['get', 'priority'], 100],
  LOW_PRIORITY_COLOR,
  ['==', ['get', 'priority'], 200],
  MEDIUM_PRIORITY_COLOR,
  ['==', ['get', 'priority'], 300],
  HIGH_PRIORITY_COLOR,
  NO_PRIORITY_COLOR,
];

const layout = {};
const paint = {
  'fill-color': PRIORITY_COLOR_EXPRESSION,
  'fill-outline-color': PRIORITY_COLOR_EXPRESSION,
  'fill-opacity': 0.4,
};

const EventGeometryLayer = ({ onClick }) => {
  const map = useContext(MapContext);

  const showReportsOnMap = useSelector(getShowReportsOnMap);
  const eventFeatureCollection = useSelector(
    getMapEventFeatureCollectionByTypeWithVirtualDate
  )?.Polygon ?? featureCollection([]);
  const mapLocationSelection = useSelector(({ view: { mapLocationSelection } }) => mapLocationSelection);

  const isDrawingEventGeometry = mapLocationSelection.isPickingLocation
    && mapLocationSelection.mode  === MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY;
  const currentGeometryBeingEdited = isDrawingEventGeometry ? (mapLocationSelection?.event?.id ?? '') : '';

  const layerConfig = {
    before: EVENT_SYMBOLS,
    condition: showReportsOnMap,
    filter: ['!=', 'id', currentGeometryBeingEdited],
    minZoom: 4,
  };

  const onMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onMouseLeave = () => map.getCanvas().style.cursor = '';

  useMapSource(EVENT_GEOMETRY, eventFeatureCollection);

  useMapLayer(EVENT_GEOMETRY_LAYER, 'fill', EVENT_GEOMETRY, paint, layout, layerConfig);

  useMapEventBinding('click', onClick, EVENT_GEOMETRY_LAYER);
  useMapEventBinding('mouseenter', onMouseEnter, EVENT_GEOMETRY_LAYER);
  useMapEventBinding('mouseleave', onMouseLeave, EVENT_GEOMETRY_LAYER);

  return null;
};

EventGeometryLayer.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default EventGeometryLayer;
