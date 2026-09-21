import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { useTranslation } from 'react-i18next';

import * as styles from './styles.module.scss';

const LOADER_SIZE = 50;

const DetailViewLoader = ({ className = '', ...otherProps }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'detailViewLoader' });

  return <div className={`${styles.detailViewLoader} ${className}`} role="status" {...otherProps}>
    <MoonLoader size={LOADER_SIZE} />

    <span className="sr-only">{t('loadingLabel')}</span>
  </div>;
};

export default DetailViewLoader;
