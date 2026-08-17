import i18next from 'i18next';

const MAXIMUM_FRACTION_DIGITS = 1;

export const formatDistanceInKilometers = (kilometers) => {
  const t = i18next.getFixedT(null, 'utils');

  return t('distanceInKilometers', {
    distance: new Intl.NumberFormat(i18next.language, { maximumFractionDigits: MAXIMUM_FRACTION_DIGITS })
      .format(kilometers),
  });
};
