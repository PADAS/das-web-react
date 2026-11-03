import { resetGlobalDateRange, updateGlobalDateRange } from '../../../../ducks/global-date-range';

const DATE_SCHEMA = { format: 'date-time', type: ['string', 'null'] };

const setDateRangeTool = {
  description: 'Set the date range shared by the events and patrols feeds and the map, like their date pickers. '
    + 'A bound left out keeps its value; a null "upper" means up to now.',
  inputSchema: {
    additionalProperties: false,
    minProperties: 1,
    properties: {
      lower: { ...DATE_SCHEMA, description: 'The start, an ISO 8601 date-time.' },
      reset: { description: 'Return to the default range, ignoring the bounds.', type: 'boolean' },
      upper: { ...DATE_SCHEMA, description: 'The end, an ISO 8601 date-time, or null for now.' },
    },
    type: 'object',
  },
  name: 'set_date_range',
  run: async (args, context) => {
    if (args.reset) {
      context.dispatch(resetGlobalDateRange());
    } else {
      const dateRange = context.getState().data.eventFilter.filter.date_range;

      context.dispatch(updateGlobalDateRange({
        lower: args.lower === undefined ? dateRange.lower : args.lower,
        upper: args.upper === undefined ? dateRange.upper : args.upper,
      }));
    }

    return { date_range: context.getState().data.eventFilter.filter.date_range };
  },
};

export default setDateRangeTool;
