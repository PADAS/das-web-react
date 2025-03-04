import { createSelector } from 'reselect';

import { mapEventTypesToCategories } from '../../utils/event-types';

const selectEventCategories = (state) => state.data.eventCategories;
const selectEventTypes = (state) => state.data.eventTypes;
const selectPatrolTypes = (state) => state.data.patrolTypes;

export const selectCreatableEventTypesByCategory = createSelector(
  [selectEventCategories, selectEventTypes],
  (eventCategories, eventTypes) => mapEventTypesToCategories(eventTypes, eventCategories)
    // Filter out the event categories for which the user don't have the create permission.
    .filter((eventCategory) => {
      if (eventCategory.flag) {
        return eventCategory.flag === 'user' ? eventCategory.permissions.includes('create') : false;
      }
      return true;
    })
    // Filter out the event types that are collections or that are readonly.
    .map((eventCategory) => ({
      ...eventCategory,
      types: eventCategory.types.filter((eventType) => !eventType.is_collection && !eventType.readonly),
    }))
    // And filter out the event categories where no event types passed the filters.
    .filter((eventCategory) => !!eventCategory.types.length)
);

export const selectDisplayEventTypes = createSelector(
  [selectEventTypes, selectPatrolTypes],
  (eventTypes, patrolTypes) => [...eventTypes, ...patrolTypes]
);

export const selectEventTypeById = createSelector(
  [selectEventTypes, (_, eventTypeId) => eventTypeId],
  (eventTypes, eventTypeId) => eventTypes.find((eventType) => eventType.id === eventTypeId)
);

export const selectEventTypeByValue = createSelector(
  [selectEventTypes, (_, eventTypeValue) => eventTypeValue],
  (eventTypes, eventTypeValue) => eventTypes.find((eventType) => eventType.value === eventTypeValue)
);
