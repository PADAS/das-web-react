import { createSelector } from 'reselect';

const EVENT_TYPE_BASE_SCHEMA_KEY = 'base';

const selectEventSchemas = (state) => state.data.eventSchemas;

export const selectEventSchema = createSelector(
  [selectEventSchemas, (_, eventTypeId) => eventTypeId, (_, _eventTypeId, eventId) => eventId],
  (eventSchemas, eventTypeId, eventId) => eventSchemas?.[eventTypeId]?.[eventId || EVENT_TYPE_BASE_SCHEMA_KEY]
);
