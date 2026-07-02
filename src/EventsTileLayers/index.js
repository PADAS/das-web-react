import { memo, useMemo } from 'react';
import { featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { selectRealtimeOverlayFeatureCollection } from '../selectors/events-realtime-overlay';
import useTileEventFeatures from '../hooks/useTileEventFeatures';

import EventsClusterSymbolsLayer from '../EventsClusterSymbolsLayer';
import EventsVectorLayer from '../EventsVectorLayer';
import EventsRealtimeOverlayLayer from '../EventsRealtimeOverlayLayer';
import MapImageFromSvgSpriteRenderer from '../MapImageFromSvgSpriteRenderer';

// Groups the event map layers that render from vector tiles.
const EventsTileLayers = ({ onEventClick }) => {
  const realtimeOverlayFeatureCollection = useSelector(selectRealtimeOverlayFeatureCollection);

  const tileEventFeatures = useTileEventFeatures();

  // Every event currently on screen. Used to preload their sprites so the
  // icons exist before the symbol layers reference them.
  const spriteFeatureCollection = useMemo(
    () => featureCollection([...tileEventFeatures.features, ...realtimeOverlayFeatureCollection.features]),
    [tileEventFeatures, realtimeOverlayFeatureCollection]
  );

  return <>
    <EventsVectorLayer onEventClick={onEventClick} />

    <EventsRealtimeOverlayLayer onEventClick={onEventClick} />

    <EventsClusterSymbolsLayer onEventClick={onEventClick} />

    {!!spriteFeatureCollection.features.length && <MapImageFromSvgSpriteRenderer
      reportFeatureCollection={spriteFeatureCollection}
    />}
  </>;
};

export default memo(EventsTileLayers);
