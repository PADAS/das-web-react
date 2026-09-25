import React from 'react';
import { useTranslation } from 'react-i18next';

import SideBarDetailViewLoader from '../../DetailViewLoader';

const DetailViewLoader = (props) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'detailViewLoader' });

  return <SideBarDetailViewLoader label={t('loadingLabel')} {...props} />;
};

export default DetailViewLoader;
