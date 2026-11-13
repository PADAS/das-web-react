import { createSelector } from 'reselect';

const selectEventStore = (state) => state.data.eventStore;
const selectLocallyEditedEventId = (state) => state.data.locallyEditedEvent?.id;

export const selectLocallyEditedEventFromStore = createSelector(
  [selectLocallyEditedEventId, selectEventStore],
  (id, eventStore) => (id ? eventStore[id] : undefined),
);
