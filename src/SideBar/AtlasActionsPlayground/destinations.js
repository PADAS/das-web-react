import { TAB_KEYS } from '../../constants';

// Per action, the view that shows what it did. Kept in the web client: Atlas
// never sees it. A draft opens its own form, so it has none.
const DESTINATIONS = {
  pin_subject_tracks: () => ({ labelKey: 'destinations.map', to: '/' }),
  set_date_range: () => ({ labelKey: 'destinations.dates', state: { openPopover: 'dates' }, to: `/${TAB_KEYS.EVENTS}` }),
  set_event_filter: () => ({ labelKey: 'destinations.eventFilters', state: { openPopover: 'filters' }, to: `/${TAB_KEYS.EVENTS}` }),
  set_map_layer_visibility: () => ({ labelKey: 'destinations.mapLayers', to: `/${TAB_KEYS.LAYERS}` }),
  set_patrol_filter: () => ({ labelKey: 'destinations.patrolFilters', state: { openPopover: 'filters' }, to: `/${TAB_KEYS.PATROLS}` }),
  show_event: (args) => ({ labelKey: 'destinations.event', to: `/${TAB_KEYS.EVENTS}/${args.event_id}` }),
  show_patrol: (args) => ({ labelKey: 'destinations.patrol', to: `/${TAB_KEYS.PATROLS}/${args.patrol_id}` }),
};

export default DESTINATIONS;
