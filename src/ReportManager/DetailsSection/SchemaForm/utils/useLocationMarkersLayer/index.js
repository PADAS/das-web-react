import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { featureCollection, lineString, point } from '@turf/turf';

import LocationDotBluePNG from '../../../../../common/images/icons/location-dot-blue.png';
import LocationDotGrayPNG from '../../../../../common/images/icons/location-dot-gray.png';

import { addMapImage } from '../../../../../utils/map';
import { LAYER_IDS, SOURCE_IDS } from '../../../../../constants';
import { MapContext } from '../../../../../App';
import { useMapEventBinding } from '../../../../../hooks';
import useMapLayers from '../../../../../hooks/useMapLayers';
import useMapSources from '../../../../../hooks/useMapSources';

const MARKERS_SOURCE_ID = SOURCE_IDS.EVENT_LOCATION_MARKERS;
const MARKER_CONNECTING_LINES_SOURCE_ID = `${SOURCE_IDS.EVENT_LOCATION_MARKERS}-lines`;

const MARKERS_LAYER_ID = LAYER_IDS.EVENT_LOCATION_MARKERS;
const MARKER_CONNECTING_LINES_LAYER_ID = `${LAYER_IDS.EVENT_LOCATION_MARKERS}-lines`;
const MARKER_CONNECTING_OUTLINES_LAYER_ID = `${LAYER_IDS.EVENT_LOCATION_MARKERS}-outlines`;

const useLocationMarkersLayer = (eventLocation, onMarkerClickCallback) => {
  const map = useContext(MapContext);

  // State variables to hold the markers and to track which one to focus, if any.
  const [focused, setFocused] = useState(null);
  const [markers, setMarkers] = useState({});

  // GeoJSON feature collection with the location of each marker as a point. We store the marker id as a feature
  // property instead of as the feature id because Mapbox doesn't support string feature ids.
  const markerPointsFeatureCollection = useMemo(() => featureCollection(
    Object.entries(markers).map(([markerId, markerLocation]) => point(
      [markerLocation.longitude, markerLocation.latitude],
      { id: markerId },
    ))
  ), [markers]);

  // GeoJSON feature collection with line strings connecting each marker to the event location.
  const markerConnectingLinesFeatureCollection = useMemo(() => {
    if (eventLocation?.latitude && eventLocation?.longitude) {
      return featureCollection(
        Object.values(markers).map((markerLocation) => lineString([
          [markerLocation.longitude, markerLocation.latitude],
          [eventLocation.longitude, eventLocation.latitude],
        ]))
      );
    }
    return null;
  }, [eventLocation?.latitude, eventLocation?.longitude, markers]);

  // Map sources for the marker points and connecting lines.
  useMapSources([{ data: markerPointsFeatureCollection, id: MARKERS_SOURCE_ID }]);
  useMapSources([{ data: markerConnectingLinesFeatureCollection, id: MARKER_CONNECTING_LINES_SOURCE_ID }]);

  // Layer for the markers.
  useMapLayers([{
    id: MARKERS_LAYER_ID,
    layout: {
      'icon-allow-overlap': true,
      // Use the blue location dot if focused, otherwise use the gray one.
      'icon-image': [
        'case',
        ['==', ['get', 'id'], focused], 'location-dot-blue',
        'location-dot-gray',
      ],
      'icon-offset': [0, -29],
      'icon-size': 0.5,
    },
    paint: { 'icon-color': 'white' },
    sourceId: MARKERS_SOURCE_ID,
    type: 'symbol',
  }]);

  // Layer for the black connecting lines.
  useMapLayers([{
    id: MARKER_CONNECTING_LINES_LAYER_ID,
    options: { before: MARKERS_LAYER_ID },
    paint: { 'line-color': 'black', 'line-width': 1 },
    sourceId: MARKER_CONNECTING_LINES_SOURCE_ID,
    type: 'line',
  }]);

  // Layer for the white outline of the connecting lines.
  useMapLayers([{
    id: MARKER_CONNECTING_OUTLINES_LAYER_ID,
    options: { before: MARKER_CONNECTING_LINES_LAYER_ID },
    paint: { 'line-color': 'white', 'line-width': 5 },
    sourceId: MARKER_CONNECTING_LINES_SOURCE_ID,
    type: 'line',
  }]);

  // Listener to trigger the marker click callback with the id of the clicked marker.
  const onMarkerClick = useCallback(
    (event) => onMarkerClickCallback(event.features[0].properties.id),
    [onMarkerClickCallback]
  );

  // Listeners to add a hover effect to the markers.
  const onMarkerMouseEnter = useCallback(() => map.getCanvas().style.cursor = 'pointer', [map]);
  const onMarkerMouseLeave = useCallback(() => map.getCanvas().style.cursor = '', [map]);

  useMapEventBinding('click', onMarkerClick, MARKERS_LAYER_ID);
  useMapEventBinding('mouseenter', onMarkerMouseEnter, MARKERS_LAYER_ID);
  useMapEventBinding('mouseleave', onMarkerMouseLeave, MARKERS_LAYER_ID);

  // Add location dot images to the map if they are not there yet.
  useEffect(() => {
    if (map) {
      if (!map.hasImage('location-dot-blue')) {
        addMapImage({ src: LocationDotBluePNG, id: 'location-dot-blue' });
      }
      if (!map.hasImage('location-dot-gray')) {
        addMapImage({ src: LocationDotGrayPNG, id: 'location-dot-gray' });
      }
    }
  }, [map]);

  // Exposed methods to update, focus and blur the markers.
  const updateLocationMarkers = useCallback((markers) => setMarkers(markers), []);
  const focusLocationMarker = useCallback((id) => setFocused(id), []);
  const blurLocationMarker = useCallback(() => setFocused(null), []);

  return { blurLocationMarker, focusLocationMarker, updateLocationMarkers };
};

export default useLocationMarkersLayer;
