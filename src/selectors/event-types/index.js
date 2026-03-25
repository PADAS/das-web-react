import { createSelector } from 'reselect';

import { mapEventTypesToCategories } from '../../utils/event-types';

const selectEventCategories = (state) => state.data.eventCategories;
const selectEventTypes = (state) => state.data.eventTypes;
const selectPatrolTypes = (state) => state.data.patrolTypes;

export const selectCreatableEventTypesByCategory = createSelector(
  [selectEventCategories, selectEventTypes],
  (eventCategories, eventTypes) => {
    // Map the event types to categories.
    const categories = mapEventTypesToCategories(eventTypes, eventCategories);

    // Filter the creatable event types of each category.
    const creatableEventTypesByCategory = [];
    categories.forEach((category) => {
      if (!category.flag || (category.flag === 'user' && category.permissions.includes('create'))) {
        // User can create event types in this category. Filter out the event
        // types that are collections or readonly.
        const creatableEventTypes = category.types.filter(
          (eventType) => !eventType.is_collection && !eventType.readonly
        );

        if (creatableEventTypes.length > 0) {
          // The category has creatable event types, add it to the result.
          creatableEventTypesByCategory.push({ ...category, types: creatableEventTypes });
        }
      }
    });

    return creatableEventTypesByCategory;
  }
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
