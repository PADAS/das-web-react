import { memo } from 'react';

import EventsClusterSymbolsLayer from '../EventsClusterSymbolsLayer';
import EventsVectorLayer from '../EventsVectorLayer';
import EventsRealtimeOverlayLayer from '../EventsRealtimeOverlayLayer';

// Groups the event map layers that render from vector tiles. The symbol layers
// request their icons lazily via the map's `styleimagemissing` handler (see
// utils/eventMapIcons), so there is no sprite preloading to do here.
const EventsTileLayers = ({ onEventClick }) => <>
  <EventsVectorLayer onEventClick={onEventClick} />

  <EventsRealtimeOverlayLayer onEventClick={onEventClick} />

  <EventsClusterSymbolsLayer onEventClick={onEventClick} />
</>;

export default memo(EventsTileLayers);
