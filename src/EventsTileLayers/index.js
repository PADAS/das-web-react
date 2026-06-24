import { memo } from 'react';
import { useSelector } from 'react-redux';

import { getMapEventFeatureCollection } from '../selectors';

import EventsVectorLayer from '../EventsVectorLayer';
import MapImageFromSvgSpriteRenderer from '../MapImageFromSvgSpriteRenderer';

const EventsTileLayers = ({ onEventClick }) => {
  // Reused only to preload the sprite images the tile symbols reference. Uses the full
  // (non-virtual-date-filtered) collection so every icon the tile shows is registered.
  const eventFeatureCollection = useSelector(getMapEventFeatureCollection);

  return <>
    <EventsVectorLayer onEventClick={onEventClick} />

    {!!eventFeatureCollection?.features?.length && <MapImageFromSvgSpriteRenderer
      reportFeatureCollection={eventFeatureCollection}
    />}
  </>;
};

export default memo(EventsTileLayers);
