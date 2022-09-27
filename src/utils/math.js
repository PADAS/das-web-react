export const truncateFloatingNumber = (value, decimals) => {
  const multiplicator =  (10 ** decimals);

  return Math.floor(value * multiplicator) / multiplicator;
};