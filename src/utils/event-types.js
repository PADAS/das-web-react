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