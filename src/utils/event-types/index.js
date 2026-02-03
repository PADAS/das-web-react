import * as colorVariables from '../../common/styles/vars/colors.module.scss';

export const calcTopRatedReportAndTypeForCollection = (collection, reportTypes) => {
  const { contains } = collection;

  if (!contains || !contains.length) return null;

  const calcPriorityRatingForEventAndEventType = (eventData) => {
    const { related_event, event_type } = eventData;
    if (related_event.hasOwnProperty('priority')) return related_event.priority;
    if (event_type && event_type.hasOwnProperty('default_priority')) return event_type.default_priority;
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


export const calcIconColorByPriority = (priority) => {
  switch (priority) {
  case 300: {
    return colorVariables.red;
  }
  case 200: {
    return colorVariables.amber;
  }
  case 100: {
    return colorVariables.green;
  }
  default: {
    return colorVariables.gray;
  }
  }
};

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
