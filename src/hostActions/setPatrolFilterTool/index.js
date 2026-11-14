import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../ducks/patrol-filter';

const STATUSES = ['active', 'done', 'cancelled'];

const UUID_LIST_SCHEMA = { items: { format: 'uuid', type: 'string' }, type: 'array' };

const omitUndefined = (object) => Object.fromEntries(Object.entries(object).filter((entry) => entry[1] !== undefined));

export const summarizePatrolFilter = (patrolFilter) => ({
  date_range: patrolFilter.filter.date_range,
  patrol_type_ids: patrolFilter.filter.patrol_type,
  statuses: patrolFilter.status,
  text: patrolFilter.filter.text,
  tracked_by_ids: patrolFilter.filter.tracked_by,
});

const setPatrolFilterTool = {
  description: 'Filter the patrols feed, like the patrols filter. Only the fields given change. The date range is '
    + 'shared with events: set it with set_date_range.',
  inputSchema: {
    additionalProperties: false,
    minProperties: 1,
    properties: {
      patrol_type_ids: {
        ...UUID_LIST_SCHEMA,
        description: 'Patrol types to show. Empty shows every type.',
        'x-source': 'patrol_types',
      },
      reset: {
        description: 'Clear the search and every filter but the date range back to the default first.',
        type: 'boolean',
      },
      statuses: {
        description: 'Statuses to show. Empty shows every status.',
        items: { enum: STATUSES, type: 'string' },
        type: 'array',
      },
      text: { description: 'The feed search text. Empty clears it.', type: 'string' },
      tracked_by_ids: {
        ...UUID_LIST_SCHEMA,
        description: 'Team leads (subjects) to show. Empty shows all.',
        'x-source': 'patrol_leaders',
      },
    },
    type: 'object',
  },
  name: 'set_patrol_filter',
  run: async (args, context) => {
    if (args.reset) {
      context.dispatch(updatePatrolFilter({
        filter: {
          patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
          text: INITIAL_FILTER_STATE.filter.text,
          tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
        },
        status: INITIAL_FILTER_STATE.status,
      }));
    }

    context.dispatch(updatePatrolFilter(omitUndefined({
      filter: omitUndefined({ patrol_type: args.patrol_type_ids, text: args.text, tracked_by: args.tracked_by_ids }),
      status: args.statuses,
    })));

    return summarizePatrolFilter(context.getState().data.patrolFilter);
  },
};

export default setPatrolFilterTool;
