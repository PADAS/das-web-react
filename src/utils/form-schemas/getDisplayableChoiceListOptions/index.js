const getDisplayableChoiceListOptions = (options, language) => {
  const displayCounts = options.reduce((accumulator, option) => {
    accumulator[option.display] = (accumulator[option.display] ?? 0) + 1;
    return accumulator;
  }, {});

  return options
    .map((option) => ({ ...option, description: displayCounts[option.display] > 1 ? option.description : '' }))
    .sort((a, b) => a.display.localeCompare(b.display, language, { sensitivity: 'base' }));
};

export default getDisplayableChoiceListOptions;
