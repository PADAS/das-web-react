export const calcTopRatedIconForEventTypes = reportTypes => [...reportTypes].sort((a, b) => b.default_priority - a.default_priority).sort((a, b) => a.ordernum - b.ordernum)[0];

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
    const cat = accumulator.find(item => item.category === reportType.category.value);
    if (!cat) {
      const data = {
        category: reportType.category.value,
        display: reportType.category.display,
        types: [reportType],
        orderNum: reportType.category.ordernum,
      };
      accumulator.push(data);
    } else {
      cat.types.push(reportType);
    }
    return accumulator;
  }, [])
  .sort((item1, item2) => item1.orderNum - item2.orderNum)
  .filter(item => !!item.types.length);