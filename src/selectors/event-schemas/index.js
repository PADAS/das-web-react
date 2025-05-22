import { createSelector } from 'reselect';

const selectEventSchemas = (state) => state.data.eventSchemas;

export const selectEventSchema = createSelector(
  [selectEventSchemas, (_, eventTypeId) => eventTypeId, (_, _eventTypeId, eventId) => eventId],
  (eventSchemas, eventTypeId, eventId) => eventSchemas?.[eventTypeId]?.[eventId || 'base']
);
