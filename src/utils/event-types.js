import colorVariables from '../common/styles/vars/colors.module.scss';

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
  .map(cat => ({
    ...cat,
    types: cat.types.sort((item1, item2) => {
      const first = typeof item1.ordernum === 'number' ? item1.ordernum : 1000;
      const second = typeof item2.ordernum === 'number' ? item2.ordernum : 1000;

      return first - second;
    })
  }))
  .sort((item1, item2) => {
    const first = typeof item1.ordernum === 'number' ? item1.ordernum : 1000;
    const second = typeof item2.ordernum === 'number' ? item2.ordernum : 1000;

    return first - second;
  })
  .filter(item => !!item.types.length);