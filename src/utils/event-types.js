export const calcTopRatedReportAndTypeForCollection = (collection, reportTypes) => {
  const { contains } = collection;

  if (!contains || !contains.length) return null;

  const calcPriorityRatingForEventAndEventType = (event, eventType) => {
    if (event.hasOwnProperty('priority')) return event.priority;
    if (eventType && eventType.hasOwnProperty('default_priority')) return eventType.default_priority;
    return 0;
  };

  const reportsWithTypes = contains.map(({ related_event }) => {
    const { event_type } = related_event;
    return {
      related_event,
      event_type: reportTypes.find(({ value }) => value === event_type),
    };
  });
  return reportsWithTypes
    .sort((a, b) => calcPriorityRatingForEventAndEventType(b) - calcPriorityRatingForEventAndEventType(a))[0];
};


export const calcIconColorByPriority = (priority) => {
  switch (priority) {
  case 300: {
    return '#D0021B';
  }
  case 200: {
    return '#FFAB24';
  }
  case 100: {
    return '#4F8317';
  }
  default: {
    return 'gray';
  }
  }
};

export const mapReportTypesToCategories = eventTypes => eventTypes
  .filter(reportType => reportType.category.value !== 'hidden')
  .reduce((accumulator, reportType) => {
    const cat = accumulator.find(item => item.value === reportType.category.value);
    if (!cat) {
      const data = {
        ...reportType.category,
        types: [reportType],
      };
      accumulator.push(data);
    } else {
      cat.types.push(reportType);
    }
    return accumulator;
  }, [])
  .sort((item1, item2) => item1.orderNum - item2.orderNum)
  .filter(item => !!item.types.length);