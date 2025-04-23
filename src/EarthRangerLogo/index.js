import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

const SOURCES = {
  horizontal: '#earth-ranger-logo-horizontal',
  horizontalWhite: '#earth-ranger-logo-horizontal-white',
  vertical: '#earth-ranger-logo-vertical',
};

const EarthRangerLogo = ({ type = 'horizontalWhite', ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'earthRangerLogo' });

  return <svg {...restProps}>
    <title>{t('title')}</title>

    <use href={SOURCES[type] || SOURCES.horizontalWhite} />
  </svg>;
};

export default memo(EarthRangerLogo);
