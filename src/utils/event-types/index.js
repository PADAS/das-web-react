import { COLOR_TOKENS } from '../colors';

const ICON_COLOR_BY_PRIORITY = {
  100: COLOR_TOKENS['ui-event-priority-green'],
  200: COLOR_TOKENS['ui-event-priority-amber'],
  300: COLOR_TOKENS['ui-event-priority-red'],
};

export const calcTopRatedReportAndTypeForCollection = (collection, reportTypes) => {
  const { contains } = collection;

  if (!contains || !contains.length) return null;

  const calcPriorityRatingForEventAndEventType = (eventData) => {
    const { related_event, event_type } = eventData;
    if (Object.hasOwn(related_event, 'priority')) return related_event.priority;
    if (event_type && Object.hasOwn(event_type, 'default_priority')) return event_type.default_priority;
    return 0;
  };

  const reportsWithTypes = contains.map(({ related_event }) => {
    const { event_type } = related_event;
    return {
      related_event,
      event_type: reportTypes.find(({ value }) => value === event_type),
    };
  });

  const sorted = reportsWithTypes
    .sort((a, b) => calcPriorityRatingForEventAndEventType(b) - calcPriorityRatingForEventAndEventType(a));

  return sorted[0];
};


export const calcIconColorByPriority = (priority) => ICON_COLOR_BY_PRIORITY[priority] ?? COLOR_TOKENS['ui-event-priority-grey'];

const getOrdernum = (item) => typeof item.ordernum === 'number' ? item.ordernum : 1000;

export const mapEventTypesToCategories = (eventTypes, eventCategories) => {
  // Map the event type categories by their value.
  const categoriesByValue = {};
  eventTypes.forEach((eventType) => {
    const eventTypeCategory = eventType.version === 1 ? eventType.category : eventCategories[eventType.category];

    if (eventTypeCategory && eventTypeCategory.value !== 'hidden') {
      // The event type category is defined and is not the hidden category. Add
      // the event type to the category types.
      if (!categoriesByValue[eventTypeCategory.value]) {
        // The category hasn't been added yet to the object. Add it with an
        // empty types array.
        categoriesByValue[eventTypeCategory.value] = { ...eventTypeCategory, types: [] };
      }

      categoriesByValue[eventTypeCategory.value].types.push(eventType);
    }
  });

  // Transform the categories object into an array.
  const categories = Object.values(categoriesByValue);

  // Sort the event types in each category by the ordernum.
  categories.forEach(
    (category) => category.types.sort((eventTypeA, eventTypeB) => getOrdernum(eventTypeA) - getOrdernum(eventTypeB))
  );

  // Sort the categories by the ordernum.
  return categories.sort(
    (eventCategoryA, eventCategoryB) => getOrdernum(eventCategoryA) - getOrdernum(eventCategoryB)
  );
};
