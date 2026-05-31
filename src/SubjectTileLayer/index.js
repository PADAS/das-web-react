import { memo, useCallback, useContext, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { MapContext } from '../App';
import { useMapEventBinding } from '../hooks';
import { addPropsToGeoJsonByKey, safeRemoveMapLayer } from '../utils/map';
import { LAYER_IDS, SYMBOL_TEXT_SIZE_EXPRESSION } from '../constants';
import { selectFreshSubjectIds } from '../selectors/subjects';
import { selectTrackLengthInDays } from '../selectors/tracks';
import { buildVtTileUrl, getVtRangeParam, VECTOR_TILE_SOURCE } from '../utils/tracks';
import { queryMultiLayerClickFeatures } from '../utils/map-handlers';

const SUBJECT_TILE_LAYER_ID = 'subject-tile-layer';
const SUBJECT_TILE_LABEL_LAYER_ID = 'subject-tile-layer-labels';

const { SKY_LAYER } = LAYER_IDS;

/**
 * Renders "stale" subjects (those whose last position is older than 1 hour)
 * from the vector tile source.  Fresh subjects are rendered by the GeoJSON
 * SubjectsLayer; the two layers together cover the full subject set without
 * duplication.
 */
const SubjectTileLayer = ({ onSubjectClick }) => {
  const map = useContext(MapContext);
  const freshSubjectIds = useSelector(selectFreshSubjectIds);
  const trackLengthInDays = useSelector(selectTrackLengthInDays);
  const rangeParam = getVtRangeParam(trackLengthInDays);
  const showInactiveRadios = useSelector((state) => state.view.showInactiveRadios);
  const subjectStore = useSelector((state) => state.data.subjectStore);

  // Ref so the click handler always reads the latest store without
  // re-creating the memoised callback on every store update (which would
  // rebind the map event listeners). Updated in an effect, not during render.
  const subjectStoreRef = useRef(subjectStore);
  useEffect(() => {
    subjectStoreRef.current = subjectStore;
  }, [subjectStore]);

  useEffect(() => {
    if (!map) return;

    // Shared with TrackSegmentsLayer. Create only if it doesn't exist yet
    // (SubjectTileLayer may mount before TrackSegmentsLayer on cold start).
    if (!map.getSource(VECTOR_TILE_SOURCE)) {
      map.addSource(VECTOR_TILE_SOURCE, {
        type: 'vector',
        tiles: [buildVtTileUrl(rangeParam)],
        minzoom: 0,
        maxzoom: 22,
      });
    }

    // Subject icon layer
    if (!map.getLayer(SUBJECT_TILE_LAYER_ID)) {
      map.addLayer({
        id: SUBJECT_TILE_LAYER_ID,
        type: 'symbol',
        source: VECTOR_TILE_SOURCE,
        'source-layer': 'subjects',
        layout: {
          'icon-image': [
            'case',
            ['==', ['get', 'subject_subtype_value'], 'ropeless_buoy_gearset'],
            'za-provincial-2',
            ['get', 'image_url'],
          ],
          'icon-size': [
            'interpolate', ['exponential', 0.5], ['zoom'],
            0, 0.2 / 3,
            11, 0.8 / 3,
            14, 1 / 3,
          ],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'text-field': '',
        },
        paint: {
          'icon-opacity': [
            'case',
            ['==', ['get', 'subject_subtype_value'], 'ropeless_buoy_gearset'], 0.5,
            1,
          ],
        },
      }, SKY_LAYER);
    }

    // Subject label layer (mirrors LabeledSymbolLayer label sublayer)
    if (!map.getLayer(SUBJECT_TILE_LABEL_LAYER_ID)) {
      map.addLayer({
        id: SUBJECT_TILE_LABEL_LAYER_ID,
        type: 'symbol',
        source: VECTOR_TILE_SOURCE,
        'source-layer': 'subjects',
        layout: {
          'icon-allow-overlap': ['step', ['zoom'], false, 10, true],
          'icon-anchor': 'bottom',
          'icon-image': 'name-label-78-sdf',
          'icon-size': 1,
          'icon-text-fit': 'both',
          'icon-text-fit-padding': [5, 8, 5, 8],
          'text-allow-overlap': ['step', ['zoom'], false, 10, true],
          'text-anchor': 'top',
          'text-offset': [0, 1.1],
          'text-field': ['get', 'name'],
          'text-justify': 'center',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': SYMBOL_TEXT_SIZE_EXPRESSION,
        },
        paint: {
          'text-halo-color': 'rgba(255,255,255,0.7)',
          'text-halo-width': 1,
          'text-halo-blur': 1,
          'text-translate-anchor': 'viewport',
          'icon-opacity': 0.5,
          'icon-color': '#ffffff',
          'text-opacity': [
            'case',
            ['==', ['get', 'subject_subtype_value'], 'ropeless_buoy_gearset'], 0,
            1,
          ],
        },
      }, SKY_LAYER);
    }

    // Remove only our own layers; TrackSegmentsLayer owns the shared source.
    return () => {
      safeRemoveMapLayer(map, SUBJECT_TILE_LABEL_LAYER_ID);
      safeRemoveMapLayer(map, SUBJECT_TILE_LAYER_ID);
    };
  }, [map, rangeParam]);

  /* ── dedup + inactive radio filter ────────────────────────────────── */

  useEffect(() => {
    if (!map || !map.getLayer(SUBJECT_TILE_LAYER_ID)) return;

    const filters = ['all'];

    // Exclude fresh subjects already rendered via GeoJSON
    if (freshSubjectIds.length > 0) {
      filters.push(['!', ['in', ['get', 'id'], ['literal', freshSubjectIds]]]);
    }

    // Respect the "show inactive radios" user preference
    if (!showInactiveRadios) {
      filters.push(['!=', ['get', 'radio_state'], 'offline']);
    }

    const filter = filters.length > 1 ? filters : null;
    map.setFilter(SUBJECT_TILE_LAYER_ID, filter);
    map.setFilter(SUBJECT_TILE_LABEL_LAYER_ID, filter);
  }, [map, freshSubjectIds, showInactiveRadios]);

  /* ── click / hover handlers ───────────────────────────────────────── */

  const handleSubjectTileClick = useCallback((event) => {
    // Defer to other layers when a click hits more than one (multi-layer awareness).
    if (queryMultiLayerClickFeatures(map, event).length > 1) return;

    const layers = [SUBJECT_TILE_LAYER_ID, SUBJECT_TILE_LABEL_LAYER_ID];
    const clickedFeature = map.queryRenderedFeatures(event.point, { layers })[0];
    if (!clickedFeature || !onSubjectClick) return;

    const subjectId = clickedFeature.properties.id;
    const storeSubject = subjectStoreRef.current[subjectId];

    if (storeSubject?.last_position) {
      // Hydrate from the Redux store – same enrichment the GeoJSON
      // SubjectsLayer path uses so SubjectPopup receives the full
      // contract (coordinateProperties, tracks_available, image, etc.).
      const enriched = addPropsToGeoJsonByKey(storeSubject, 'last_position');
      onSubjectClick({ event, layer: enriched.last_position });
    } else {
      // Fallback: reshape flat tile properties to the minimum shape
      // SubjectPopup needs when the subject isn't in the store.
      const { properties, geometry } = clickedFeature;
      const layer = {
        type: 'Feature',
        geometry,
        properties: {
          ...properties,
          image: properties.image_url,
          coordinateProperties: { time: properties.recorded_at },
        },
      };
      onSubjectClick({ event, layer });
    }
  }, [map, onSubjectClick]);

  const onMouseEnter = useCallback(() => {
    if (map) map.getCanvas().style.cursor = 'pointer';
  }, [map]);

  const onMouseLeave = useCallback(() => {
    if (map) map.getCanvas().style.cursor = '';
  }, [map]);

  useMapEventBinding('click', handleSubjectTileClick, SUBJECT_TILE_LAYER_ID, !!onSubjectClick);
  useMapEventBinding('click', handleSubjectTileClick, SUBJECT_TILE_LABEL_LAYER_ID, !!onSubjectClick);

  useMapEventBinding('mouseenter', onMouseEnter, SUBJECT_TILE_LAYER_ID);
  useMapEventBinding('mouseenter', onMouseEnter, SUBJECT_TILE_LABEL_LAYER_ID);

  useMapEventBinding('mouseleave', onMouseLeave, SUBJECT_TILE_LAYER_ID);
  useMapEventBinding('mouseleave', onMouseLeave, SUBJECT_TILE_LABEL_LAYER_ID);

  return null;
};

export default memo(SubjectTileLayer);
