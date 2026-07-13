import { memo, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { primeEventIconParams } from '../utils/eventMapIcons';
import { selectRealtimeOverlayFeatureCollection } from '../selectors/events-realtime-overlay';
import useTileEventFeatures from '../hooks/useTileEventFeatures';

import EventsClusterSymbolsLayer from '../EventsClusterSymbolsLayer';
import EventsVectorLayer from '../EventsVectorLayer';
import EventsRealtimeOverlayLayer from '../EventsRealtimeOverlayLayer';

// Groups the event map layers that render from vector tiles. The symbol layers
// request their icons lazily via the map's `styleimagemissing` handler (see
// utils/eventMapIcons), so there is no sprite preloading to do here.
const EventsTileLayers = ({ onEventClick }) => {
  const tileEventFeatures = useTileEventFeatures();
  const realtimeOverlayFeatureCollection = useSelector(selectRealtimeOverlayFeatureCollection);

  // Prime icon params for the tile + realtime overlay features so the map's
  // styleimagemissing handler can recover full event context (color/state/image)
  // that the parsed icon id alone can't carry.
  const primableFeatures = useMemo(
    () => [...tileEventFeatures.features, ...realtimeOverlayFeatureCollection.features],
    [realtimeOverlayFeatureCollection, tileEventFeatures]
  );
  useEffect(() => {
    primeEventIconParams(primableFeatures);
  }, [primableFeatures]);

  return <>
    <EventsVectorLayer onEventClick={onEventClick} />

    <EventsRealtimeOverlayLayer onEventClick={onEventClick} />

    <EventsClusterSymbolsLayer onEventClick={onEventClick} />
  </>;
};

export default memo(EventsTileLayers);
