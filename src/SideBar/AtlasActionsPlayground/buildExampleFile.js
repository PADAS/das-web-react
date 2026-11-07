const PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000000';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

const firstKey = (object) => Object.keys(object ?? {})[0];

// Ids are taken from what the site has loaded, so an example works when run.
const EXAMPLE_ARGUMENTS_BUILDERS = {
  pin_subject_tracks: (state) => ({
    subject_ids: [
      Object.values(state.data.subjectStore ?? {}).find((subject) => subject.tracks_available)?.id ?? PLACEHOLDER_ID,
    ],
  }),
  set_date_range: () => ({ lower: new Date(Date.now() - 7 * DAY_MILLISECONDS).toISOString(), upper: null }),
  set_event_filter: () => ({ priorities: ['red'], states: ['active'] }),
  set_map_layer_visibility: (state) => {
    const subjectGroupId = state.data.subjectGroups?.[0]?.id;

    return subjectGroupId ? { subject_group_ids: [subjectGroupId], visible: false } : { events_layer: true, visible: false };
  },
  set_patrol_filter: () => ({ statuses: ['active'] }),
  show_event: (state) => ({
    event_id: Object.values(state.data.eventStore ?? {}).find((event) => event.geojson)?.id
      ?? firstKey(state.data.eventStore)
      ?? PLACEHOLDER_ID,
  }),
  show_patrol: (state) => ({ patrol_id: firstKey(state.data.patrolStore) ?? PLACEHOLDER_ID }),
};

const buildExampleFile = (name, state) => JSON.stringify(
  { name, arguments: EXAMPLE_ARGUMENTS_BUILDERS[name]?.(state) ?? {} },
  null,
  2
);

export default buildExampleFile;
