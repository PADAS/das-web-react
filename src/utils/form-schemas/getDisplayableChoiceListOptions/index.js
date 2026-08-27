const getDisplayableChoiceListOptions = (options) => {
  const displayCounts = options.reduce((accumulator, option) => {
    accumulator[option.display] = (accumulator[option.display] ?? 0) + 1;
    return accumulator;
  }, {});

  return options
    .map((option) => ({ ...option, description: displayCounts[option.display] > 1 ? option.description : '' }));
};

export default getDisplayableChoiceListOptions;
