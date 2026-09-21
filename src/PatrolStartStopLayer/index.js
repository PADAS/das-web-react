import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { addFeatureCollectionImagesToMap, safeRemoveMapSourceAndItsLayers } from '../utils/map';
import { DEFAULT_SYMBOL_PAINT, LAYER_IDS } from '../constants';
import { MapContext } from '../MapContext';
import { PATROL_MARKER_KINDS } from '../utils/patrols';
import { selectPatrolMapTrackData, selectPatrolsWithTracks } from '../selectors/patrols';
import { uuid } from '../utils/string';

import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';

const { PATROL_SYMBOLS } = LAYER_IDS;

const LINE_PAINT = {
  'line-color': [
    'case',
    ['has', 'stroke'], ['get', 'stroke'],
    'orange',
  ],
  'line-dasharray': [1, 2],
  'line-width': ['step', ['zoom'], 2, 8, 2.5],
  'line-offset': -0.75,
  'line-opacity': 0.8,
};

const LINE_LAYOUT = {
  'line-join': 'round',
  'line-cap': 'round',
};

const SYMBOL_PAINT = {
  ...DEFAULT_SYMBOL_PAINT,
  'text-halo-blur': 0.5,
  'text-halo-color': 'rgba(0,0,0,0.7)',
  'text-halo-width': 0.5,
};

// Every patrol marker is a pin, so it hangs off the spot it marks rather than
// sitting centred over it.
const SYMBOL_LAYOUT = {
  'icon-anchor': 'bottom',
};

const TEXT_LAYOUT = {
  'text-field': '{title}',
};

const SYMBOL_FILTER = ['==', ['geometry-type'], 'Point'];

// [plain, estimated] label key per marker kind. A marker carries what it is,
// so its label follows the language and survives an unloaded namespace.
const MARKER_LABEL_KEYS = {
  [PATROL_MARKER_KINDS.END]: ['endMarkerLabel', 'estimatedEndMarkerLabel'],
  [PATROL_MARKER_KINDS.START]: ['startMarkerLabel', 'estimatedStartMarkerLabel'],
  [PATROL_MARKER_KINDS.START_AND_END]: ['startAndEndMarkerLabel', 'estimatedStartAndEndMarkerLabel'],
};

const EMPTY_FEATURE_COLLECTION = { features: [], type: 'FeatureCollection' };

export const PatrolMarkers = ({ patrol }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolStartStopLayer' });

  const patrolMapTrackData = useSelector((state) => selectPatrolMapTrackData(state, patrol));

  const map = useContext(MapContext);

  const [instanceId] = useState(uuid());
  const [pointsWithLoadedImages, setPointsWithLoadedImages] = useState(null);

  const layerId = `${PATROL_SYMBOLS}-${instanceId}`;
  const linesLayerId = `${layerId}-lines`;
  const sourceId = `patrol-symbol-source-${instanceId}`;

  const lines = patrolMapTrackData?.startStopGeometries?.lines;
  const points = patrolMapTrackData?.startStopGeometries?.points;

  // A patrol the time slider has rewound past has no markers left, and the set
  // it last drew goes with them rather than standing over a track that is gone.
  const drawablePoints = points ? pointsWithLoadedImages : null;

  const withMarkerLabel = useCallback((feature) => {
    const { isEstimated, legNumber, markerKind, pauseNumber } = feature.properties ?? {};

    if (markerKind === PATROL_MARKER_KINDS.LEG) {
      return { ...feature, properties: { ...feature.properties, title: t('legMarkerLabel', { legNumber }) } };
    }

    if (markerKind === PATROL_MARKER_KINDS.PAUSE) {
      return { ...feature, properties: { ...feature.properties, title: t('pauseMarkerLabel', { pauseNumber }) } };
    }

    const labelKeys = MARKER_LABEL_KEYS[markerKind];

    return labelKeys
      ? { ...feature, properties: { ...feature.properties, title: t(labelKeys[isEstimated ? 1 : 0]) } }
      : feature;
  }, [t]);

  const sourceData = useMemo(() => ({
    features: [
      ...(drawablePoints?.features || []),
      ...(lines?.features || []),
    ].filter((feature) => !!feature).map(withMarkerLabel),
    type: 'FeatureCollection',
  }), [drawablePoints, lines, withMarkerLabel]);

  const layerLinePaint = useMemo(() => ({ ...LINE_PAINT, 'line-color': ['get', 'stroke'] }), []);
  const layerSymbolPaint = useMemo(() => ({ ...SYMBOL_PAINT, 'text-color': ['get', 'stroke'] }), []);

  // A symbol is laid out once: a pin whose icon reaches the style after the
  // source data draws nothing at all. So the icons go in first, pins after.
  useEffect(() => {
    if (!map || !points) {
      return undefined;
    }

    let arePointsCurrent = true;

    addFeatureCollectionImagesToMap(points, {}, map).then((images) => {
      images.forEach((image) => {
        if (!map.hasImage(image.icon_id)) {
          map.addImage(image.icon_id, image.img);
        }
      });

      if (arePointsCurrent) {
        setPointsWithLoadedImages(points);
      }
    });

    return () => {
      arePointsCurrent = false;
    };
  }, [map, points]);

  useEffect(() => {
    if (!map) {
      return undefined;
    }

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { data: EMPTY_FEATURE_COLLECTION, type: 'geojson' });
    }

    if (!map.getLayer(linesLayerId)) {
      map.addLayer({
        id: linesLayerId,
        layout: LINE_LAYOUT,
        paint: layerLinePaint,
        source: sourceId,
        type: 'line',
      });
    }

    // The markers the symbol layer below draws sit on this source too, so they
    // come off with it rather than outliving it.
    return () => safeRemoveMapSourceAndItsLayers(map, sourceId);
  }, [layerLinePaint, linesLayerId, map, sourceId]);

  useEffect(() => {
    if (map) {
      map.getSource(sourceId)?.setData?.(sourceData);
    }
  }, [map, sourceData, sourceId]);

  // The pins live on the source added above, and a child's effect runs before
  // its parent's: holding the layer back a render is what lets it find one.
  if (!drawablePoints) {
    return null;
  }

  return <LabeledPatrolSymbolLayer
    filter={SYMBOL_FILTER}
    id={layerId}
    layout={SYMBOL_LAYOUT}
    paint={layerSymbolPaint}
    sourceId={sourceId}
    textLayout={TEXT_LAYOUT}
  />;
};

const MemoizedPatrolMarkers = memo(PatrolMarkers);

const PatrolStartStopLayer = () => {
  const patrolsWithTracks = useSelector(selectPatrolsWithTracks);

  return patrolsWithTracks.map((patrol) => <MemoizedPatrolMarkers key={patrol.id} patrol={patrol} />);
};

export default memo(PatrolStartStopLayer);
