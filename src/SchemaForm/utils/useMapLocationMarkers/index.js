import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { featureCollection, lineString, point } from '@turf/turf';

import LocationDotBluePNG from '../../../common/images/icons/location-dot-blue.png';
import LocationDotGrayPNG from '../../../common/images/icons/location-dot-gray.png';

import { addMapImage } from '../../../utils/map';
import { LAYER_IDS, SOURCE_IDS } from '../../../constants';
import { MapContext } from '../../../MapContext';

const MARKERS_SOURCE_ID = SOURCE_IDS.FORM_LOCATION_MARKERS;
const MARKER_CONNECTING_LINES_SOURCE_ID = `${SOURCE_IDS.FORM_LOCATION_MARKERS}-lines`;

const MARKERS_LAYER_ID = LAYER_IDS.FORM_LOCATION_MARKERS;
const MARKER_CONNECTING_LINES_LAYER_ID = `${LAYER_IDS.FORM_LOCATION_MARKERS}-lines`;
const MARKER_CONNECTING_OUTLINES_LAYER_ID = `${LAYER_IDS.FORM_LOCATION_MARKERS}-outlines`;

const useMapLocationMarkers = (anchorLocation = null, onMarkerClick = null, hideLayers = false) => {
  const map = useContext(MapContext);

  const id = useId();

  const [focusedMarkerId, setFocusedMarkerId] = useState(null);
  const [markers, setMarkers] = useState({});

  // Build and store the source ids in a ref to avoid memoization processing.
  const sourceIdsRef = useRef({
    markers: `${MARKERS_SOURCE_ID}-${id}`,
    markerConnectingLines: `${MARKER_CONNECTING_LINES_SOURCE_ID}-${id}`,
  });

  // Same with layer ids.
  const layerIdsRef = useRef({
    markers: `${MARKERS_LAYER_ID}-${id}`,
    markerConnectingLines: `${MARKER_CONNECTING_LINES_LAYER_ID}-${id}`,
    markerConnectinOutlines: `${MARKER_CONNECTING_OUTLINES_LAYER_ID}-${id}`,
  });

  // The data for the markers source is a feature collection of points where each point is the location of a marker and
  // its id is stored in the feature properties (Mapbox doesn't support string feature ids).
  const markersSourceData = useMemo(() => featureCollection(
    Object.entries(markers).map(([markerId, markerLocation]) => point(
      [markerLocation.longitude, markerLocation.latitude],
      { id: markerId },
    ))
  ), [markers]);

  // The data for the marker connecting lines source is a feature collection of two-coordinates line strings connecting
  // each marker to the anchor location, if it is available.
  const anchorLocationLatitude = anchorLocation?.latitude;
  const anchorLocationLongitude = anchorLocation?.longitude;
  const markerConnectingLinesSourceData = useMemo(() => featureCollection(
    anchorLocationLatitude != null && anchorLocationLongitude != null
      ? Object.values(markers).map((markerLocation) => lineString([
        [markerLocation.longitude, markerLocation.latitude],
        [anchorLocationLongitude, anchorLocationLatitude],
      ]))
      : []
  ), [anchorLocationLatitude, anchorLocationLongitude, markers]);

  useEffect(() => {
    if (map) {
      const markersSource = map.getSource(sourceIdsRef.current.markers);
      if (!markersSource) {
        // Add the markers source if it is not in the map.
        map.addSource(sourceIdsRef.current.markers, { data: markersSourceData, type: 'geojson' });
      } else {
        // If the markers source is in the map, update its data whenever it changes.
        markersSource.setData(markersSourceData);
      }
    }
  }, [map, markersSourceData]);

  useEffect(() => {
    if (map) {
      const markerConnectingLinesSource = map.getSource(sourceIdsRef.current.markerConnectingLines);
      if (!markerConnectingLinesSource) {
        // Add the marker connecting lines source if it is not in the map.
        map.addSource(
          sourceIdsRef.current.markerConnectingLines,
          { data: markerConnectingLinesSourceData, type: 'geojson' }
        );
      } else {
        // If the marker connecting lines source is in the map, update its data whenever it changes.
        markerConnectingLinesSource.setData(markerConnectingLinesSourceData);
      }
    }
  }, [map, markerConnectingLinesSourceData]);

  useEffect(() => {
    if (map) {
      if (!map.getLayer(layerIdsRef.current.markers)) {
        // Add the markers layer if it is not in the map.
        map.addLayer({
          id: layerIdsRef.current.markers,
          layout: {
            'icon-allow-overlap': true,
            'icon-image': [
              'case',
              ['==', ['get', 'id'], focusedMarkerId], 'location-dot-blue',
              'location-dot-gray',
            ],
            'icon-offset': [0, -29],
            'icon-size': 0.5,
          },
          source: sourceIdsRef.current.markers,
          type: 'symbol',
        });
      } else {
        // If the markers layer is in the map, update its layout whenever the focused marker changes.
        map.setLayoutProperty(layerIdsRef.current.markers, 'icon-image', [
          'case',
          ['==', ['get', 'id'], focusedMarkerId], 'location-dot-blue',
          'location-dot-gray',
        ]);
      }
    }
  }, [focusedMarkerId, map]);

  useEffect(() => {
    // If the onMarkerClick callback is defined, add listeners to the markers layer to add a hover effect and propagate
    // the click events.
    if (map && onMarkerClick) {
      const onMarkersLayerClick = (event) => onMarkerClick(event.features[0].properties.id);
      const onMarkersLayerMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
      const onMarkersLayerMouseLeave = () => map.getCanvas().style.cursor = '';

      const layerIds = layerIdsRef.current;

      map.on('click', layerIds.markers, onMarkersLayerClick);
      map.on('mouseenter', layerIds.markers, onMarkersLayerMouseEnter);
      map.on('mouseleave', layerIds.markers, onMarkersLayerMouseLeave);

      return () => {
        map.off('click', layerIds.markers, onMarkersLayerClick);
        map.off('mouseenter', layerIds.markers, onMarkersLayerMouseEnter);
        map.off('mouseleave', layerIds.markers, onMarkersLayerMouseLeave);
      };
    }
  }, [map, onMarkerClick]);

  useEffect(() => {
    if (map) {
      // If the location dot images are not in the map yet, add them.
      if (!map.hasImage('location-dot-blue')) {
        addMapImage({ src: LocationDotBluePNG, id: 'location-dot-blue' });
      }
      if (!map.hasImage('location-dot-gray')) {
        addMapImage({ src: LocationDotGrayPNG, id: 'location-dot-gray' });
      }

      const layerIds = layerIdsRef.current;
      const sourceIds = sourceIdsRef.current;

      // Add the marker connecting lines and outlines layers when the hook mounts.
      map.addLayer({
        id: layerIds.markerConnectingLines,
        paint: { 'line-color': 'black', 'line-width': 1 },
        source: sourceIds.markerConnectingLines,
        type: 'line',
      }, layerIds.markers);
      map.addLayer({
        id: layerIds.markerConnectinOutlines,
        paint: { 'line-color': 'white', 'line-width': 5 },
        source: sourceIds.markerConnectingLines,
        type: 'line',
      }, layerIds.markerConnectingLines);

      // Clean all the layers and sources when the hook unmounts.
      return () => {
        map.removeLayer(layerIds.markerConnectinOutlines);
        map.removeLayer(layerIds.markerConnectingLines);
        map.removeLayer(layerIds.markers);

        map.removeSource(sourceIds.markerConnectingLines);
        map.removeSource(sourceIds.markers);
      };
    }
  }, [map]);

  useEffect(() => {
    if (map) {
      // Update the visibility layout property of the three layers whenever the hideLayers value changes.
      if (hideLayers) {
        map.setLayoutProperty(layerIdsRef.current.markerConnectinOutlines, 'visibility', 'none');
        map.setLayoutProperty(layerIdsRef.current.markerConnectingLines, 'visibility', 'none');
        map.setLayoutProperty(layerIdsRef.current.markers, 'visibility', 'none');
      } else {
        map.setLayoutProperty(layerIdsRef.current.markerConnectinOutlines, 'visibility', 'visible');
        map.setLayoutProperty(layerIdsRef.current.markerConnectingLines, 'visibility', 'visible');
        map.setLayoutProperty(layerIdsRef.current.markers, 'visibility', 'visible');
      }
    }
  }, [hideLayers, map]);

  // Returned methods to set the location markers and focus them.
  const setLocationMarkers = useCallback((markers) => setMarkers(markers), []);
  const focusLocationMarker = useCallback((id) => setFocusedMarkerId(id), []);
  const blurLocationMarker = useCallback(() => setFocusedMarkerId(null), []);

  return { blurLocationMarker, focusLocationMarker, setLocationMarkers };
};

export default useMapLocationMarkers;
