import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { TAB_KEYS } from '../../../../../constants';

import PatrolsManagerHeader from '../../../Header';

import * as styles from './styles.module.scss';

const Header = ({ patrolId, patrolTitle }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'newLeg.header' });

  const crumbs = [
    { label: t('breadcrumbPatrolsLabel'), to: `/${TAB_KEYS.PATROLS}` },
    { label: patrolTitle, to: `/${TAB_KEYS.PATROLS}/${patrolId}` },
    { label: t('breadcrumbNewLegLabel') },
  ];

  const renderTitleBar = () => <h2 className={styles.title}>{t('title')}</h2>;

  return <PatrolsManagerHeader crumbs={crumbs} renderTitleBar={renderTitleBar} />;
};

export default memo(Header);
