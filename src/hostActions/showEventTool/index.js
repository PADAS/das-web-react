import { calcTitleAndSubtitle } from '../../utils/titles';
import {
  eventTypeTitleForEvent,
  getCoordinatesForCollection,
  getCoordinatesForEvent,
  getEventIdsForCollection,
  getReportLink,
} from '../../utils/events';
import { fetchEvent } from '../../ducks/events';
import HostToolError, { HOST_TOOL_ERROR_CODES } from '../HostToolError';
import { REPORT_PRIORITIES } from '../../constants';
import { setBounceEventIDs } from '../../ducks/map-ui';

// Clearing the bounce first lets a repeated call bounce the same event again.
const BOUNCE_DELAY = 100;

const findEvent = async (eventId, context) => {
  if (!context.getState().data.eventStore[eventId]) {
    try {
      await context.dispatch(fetchEvent(eventId));
    } catch (error) {
      if (error?.response?.status === 404) {
        throw new HostToolError(HOST_TOOL_ERROR_CODES.NOT_FOUND, `No event with id ${eventId}.`);
      }

      throw error;
    }
  }

  return context.getState().data.eventStore[eventId];
};

const showEventTool = {
  description: 'Center the map on an event and bounce its marker, like "jump to location" in the events feed. '
    + 'It does not open the event: the result carries a link to its detail view.',
  inputSchema: {
    additionalProperties: false,
    properties: {
      event_id: { description: 'The event id, a UUID.', format: 'uuid', type: 'string', 'x-source': 'recent_events' },
    },
    required: ['event_id'],
    type: 'object',
  },
  name: 'show_event',
  run: async (args, context) => {
    const event = await findEvent(args.event_id, context);
    const coordinates = event.is_collection ? getCoordinatesForCollection(event) : getCoordinatesForEvent(event);
    const hasLocation = !!coordinates?.length;

    if (hasLocation) {
      context.jumpToLocation(coordinates);

      context.dispatch(setBounceEventIDs([]));
      setTimeout(() => context.dispatch(
        setBounceEventIDs(event.is_collection ? getEventIdsForCollection(event) : [event.id])
      ), BOUNCE_DELAY);
    }

    const state = context.getState();

    return {
      detail_url: getReportLink(event),
      event_id: event.id,
      events_layer_visible: state.data.mapLayerFilter.showReportsOnMap,
      map_centered: hasLocation,
      priority: REPORT_PRIORITIES.find((priority) => priority.value === event.priority)?.key ?? null,
      serial_number: event.serial_number,
      state: event.state,
      title: calcTitleAndSubtitle(event.title, eventTypeTitleForEvent(event, state.data.eventTypes)).title || null,
    };
  },
};

export default showEventTool;
