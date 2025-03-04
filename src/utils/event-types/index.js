import colorVariables from '../../common/styles/vars/colors.module.scss';

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

export const mapEventTypesToCategories = (eventTypes, eventCategories) => {
  const visibleEventTypesMappedByCategory = eventTypes.reduce((accumulator, eventType) => {
    // Read the event type category. The location of the event category value property depends on the event type
    // version.
    const eventTypeCategory = eventType.version === 1
      ? eventType.category
      : eventCategories[eventType.category];

    if (eventTypeCategory.value === 'hidden') {
      // Ignore the hidden category.
      return accumulator;
    }
    if (accumulator[eventTypeCategory.value]) {
      // Append the event type to the types of an event category that is already in the accumulator.
      return {
        ...accumulator,
        [eventTypeCategory.value]: {
          ...accumulator[eventTypeCategory.value],
          types: [...accumulator[eventTypeCategory.value].types, eventType],
        },
      };
    }
    // If the event category is not yet in the accumulator, add it with the event type mapped in its types.
    return {
      ...accumulator,
      [eventTypeCategory.value]: {
        ...eventTypeCategory,
        types: [eventType],
      },
    };
  }, {});

  return Object.values(visibleEventTypesMappedByCategory)
    // Sort the event types in each category by their ordernum.
    .map((eventCategory) => ({
      ...eventCategory,
      types: eventCategory.types.sort((eventTypeA, eventTypeB) => {
        const eventTypeAOrdernum = typeof eventTypeA.ordernum === 'number' ? eventTypeA.ordernum : 1000;
        const eventTypeBOrdernum = typeof eventTypeB.ordernum === 'number' ? eventTypeB.ordernum : 1000;
        return eventTypeAOrdernum - eventTypeBOrdernum;
      })
    }))
    // Sort the event categories by their ordernum.
    .sort((eventCategoryA, eventCategoryB) => {
      const eventCategoryAOrdernum = typeof eventCategoryA.ordernum === 'number'
        ? eventCategoryA.ordernum
        : 1000;
      const eventCategoryBOrdernum = typeof eventCategoryB.ordernum === 'number'
        ? eventCategoryB.ordernum
        : 1000;
      return eventCategoryAOrdernum - eventCategoryBOrdernum;
    });
};
