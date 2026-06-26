import { memo, useContext, useMemo, useRef } from 'react';
import noop from 'lodash/noop';

import {
  DEFAULT_SYMBOL_LAYOUT,
  IF_IS_GENERIC,
  LAYER_IDS,
  MAP_ICON_SCALE,
  SOURCE_IDS,
} from '../constants';
import LabeledSymbolLayer from '../LabeledSymbolLayer';
import { MapContext } from '../MapContext';
import { withMultiLayerHandlerAwareness } from '../utils/map-handlers';

const LABELS_LAYER_ID = `${LAYER_IDS.EVENTS_VECTOR_CLUSTER_SYMBOLS}-labels`;

const ICON_LAYOUT = {
  ...DEFAULT_SYMBOL_LAYOUT,
  'icon-allow-overlap': true,
  'text-allow-overlap': true,
  'icon-image': ['concat',
    ['get', 'icon_id'],
    '-',
    ['get', 'priority'],
    ['case', ['has', 'width'], ['concat', '-', ['get', 'width']], ''],
    ['case', ['has', 'height'], ['concat', '-', ['get', 'height']], ''],
  ],
  'icon-size': [
    'interpolate', ['exponential', 0.5], ['zoom'],
    0, IF_IS_GENERIC(0.125 / MAP_ICON_SCALE, 0.25 / MAP_ICON_SCALE),
    12, IF_IS_GENERIC(0.5 / MAP_ICON_SCALE, 1 / MAP_ICON_SCALE),
  ],
  'text-field': '',
  'text-size': 0,
};

const LABEL_LAYOUT = {
  'text-field': '{display_title}',
  'text-size': ['interpolate', ['exponential', 0.5], ['zoom'], 0, 5, 6, 8, 14, 13],
  'text-font': [
    'case',
    ['==', ['get', 'locallyEdited'], true],
    ['literal', ['Open Sans Italic']],
    ['literal', ['Open Sans Semibold', 'Arial Unicode MS Bold']],
  ],
};

const SINGLETON_EVENT_FILTER = [
  'all',
  ['has', 'event_type'],
  ['==', ['has', 'point_count'], false],
  ['==', ['geometry-type'], 'Point'],
];

const EventsClusterSymbolsLayer = ({ onEventClick }) => {
  const map = useContext(MapContext);

  // Guards against the click firing twice when the icon and label layers overlap.
  const clicking = useRef(false);

  /* eslint-disable react-hooks/refs */
  const handleEventClick = useMemo(() => (map ? withMultiLayerHandlerAwareness(
    map,
    (event) => {
      if (clicking.current) return;
      clicking.current = true;
      setTimeout(() => { clicking.current = false; });

      const clickedFeature = map.queryRenderedFeatures(
        event.point,
        { layers: [LAYER_IDS.EVENTS_VECTOR_CLUSTER_SYMBOLS, LABELS_LAYER_ID].filter((id) => map.getLayer(id)) }
      )[0];
      // Normalized features already carry `id` + `event_type`, which is all onSelectEvent needs.
      if (clickedFeature && onEventClick) {
        onEventClick({ event, layer: clickedFeature });
      }
    }
  ) : noop), [map, onEventClick]);
  /* eslint-enable react-hooks/refs */

  const before = map?.getLayer?.(LAYER_IDS.SUBJECT_SYMBOLS) ? LAYER_IDS.SUBJECT_SYMBOLS : undefined;

  return <LabeledSymbolLayer
    before={before}
    filter={SINGLETON_EVENT_FILTER}
    id={LAYER_IDS.EVENTS_VECTOR_CLUSTER_SYMBOLS}
    layout={ICON_LAYOUT}
    onClick={handleEventClick}
    sourceId={SOURCE_IDS.CLUSTERS_SOURCE_ID}
    textLayout={LABEL_LAYOUT}
    type="symbol"
  />;
};

export default memo(EventsClusterSymbolsLayer);
