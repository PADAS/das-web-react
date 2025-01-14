export const getMaxDateAndTime = (max, value) => {
  const [dateValue] = value.split('T');
  const [maxDate, maxTime] = max.split('T');

  // We only apply a max time if there is a max date and the current value date matches it.
  let shoudlApplyMaxTime = false;
  if (maxDate && dateValue === maxDate) {
    shoudlApplyMaxTime = true;
  }

  return [maxDate, shoudlApplyMaxTime ? maxTime : undefined];
};

export const getMinDateAndTime = (min, value) => {
  const [dateValue] = value.split('T');
  const [minDate, minTime] = min.split('T');

  // We only apply a min time if there is a min date and the current value date matches it.
  let shoudlApplyMinTime = false;
  if (minDate && dateValue === minDate) {
    shoudlApplyMinTime = true;
  }

  return [minDate, shoudlApplyMinTime ? minTime : undefined];
};
