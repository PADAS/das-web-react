import { EVENT_STATE_CHOICES, REPORT_PRIORITIES } from '../../constants';
import { INITIAL_FILTER_STATE, updateEventFilter } from '../../ducks/event-filter';

const STATE_CHOICES = EVENT_STATE_CHOICES.filter((stateChoice) => !!stateChoice.value);

const PRIORITY_VALUES_BY_KEY = Object.fromEntries(REPORT_PRIORITIES.map((priority) => [priority.key, priority.value]));

const UUID_LIST_SCHEMA = { items: { format: 'uuid', type: 'string' }, type: 'array' };

const omitUndefined = (object) => Object.fromEntries(Object.entries(object).filter((entry) => entry[1] !== undefined));

// A choice covers several API states, and counts only when all are set.
const stateKeysForStates = (states) => states
  ? STATE_CHOICES
    .filter((stateChoice) => stateChoice.value.every((value) => states.includes(value)))
    .map((stateChoice) => stateChoice.key)
  : [];

export const summarizeEventFilter = (eventFilter) => ({
  date_range: eventFilter.filter.date_range,
  event_type_ids: eventFilter.filter.event_type,
  priorities: REPORT_PRIORITIES
    .filter((priority) => eventFilter.filter.priority.includes(priority.value))
    .map((priority) => priority.key),
  reported_by_ids: eventFilter.filter.reported_by,
  states: stateKeysForStates(eventFilter.state),
  text: eventFilter.filter.text,
});

const setEventFilterTool = {
  description: 'Filter the events feed and the events on the map, like the events filter. Only the fields given '
    + 'change. The date range is shared with patrols: set it with set_date_range.',
  inputSchema: {
    additionalProperties: false,
    minProperties: 1,
    properties: {
      event_type_ids: {
        ...UUID_LIST_SCHEMA,
        description: 'Event types to show. Empty shows every type.',
        'x-source': 'event_types',
      },
      priorities: {
        description: 'Priorities to show. Empty shows every priority.',
        items: { enum: Object.keys(PRIORITY_VALUES_BY_KEY), type: 'string' },
        type: 'array',
      },
      reported_by_ids: {
        ...UUID_LIST_SCHEMA,
        description: 'Reporters (users or subjects) to show. Empty shows all.',
        'x-source': 'reporters',
      },
      reset: {
        description: 'Clear the search and every filter but the date range back to the default first.',
        type: 'boolean',
      },
      states: {
        description: 'States to show. Empty shows every state.',
        items: { enum: STATE_CHOICES.map((stateChoice) => stateChoice.key), type: 'string' },
        type: 'array',
      },
      text: { description: 'The feed search text. Empty clears it.', type: 'string' },
    },
    type: 'object',
  },
  name: 'set_event_filter',
  run: async (args, context) => {
    if (args.reset) {
      context.dispatch(updateEventFilter({
        filter: {
          event_type: INITIAL_FILTER_STATE.filter.event_type,
          priority: INITIAL_FILTER_STATE.filter.priority,
          reported_by: INITIAL_FILTER_STATE.filter.reported_by,
          text: INITIAL_FILTER_STATE.filter.text,
        },
        state: INITIAL_FILTER_STATE.state,
      }));
    }

    context.dispatch(updateEventFilter(omitUndefined({
      filter: omitUndefined({
        event_type: args.event_type_ids,
        priority: args.priorities?.map((priorityKey) => PRIORITY_VALUES_BY_KEY[priorityKey]),
        reported_by: args.reported_by_ids,
        text: args.text,
      }),
      // No state at all is how the API reads every state.
      state: args.states && (args.states.length
        ? STATE_CHOICES
          .filter((stateChoice) => args.states.includes(stateChoice.key))
          .flatMap((stateChoice) => stateChoice.value)
        : null),
    })));

    return summarizeEventFilter(context.getState().data.eventFilter);
  },
};

export default setEventFilterTool;
