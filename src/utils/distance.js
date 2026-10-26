import i18next from 'i18next';

const MAXIMUM_FRACTION_DIGITS = 1;

// `t` must be bound to the `utils` namespace.
export const formatDistanceInKilometers = (t, kilometers) => t('distanceInKilometers', {
  distance: new Intl.NumberFormat(i18next.language, { maximumFractionDigits: MAXIMUM_FRACTION_DIGITS })
    .format(kilometers),
});
