import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { TAB_KEYS } from '../../../../../constants';

import PatrolsManagerHeader from '../../../Header';
import SvgIcon from '../../../../../SvgIcon';

import * as styles from './styles.module.scss';

const Header = ({ patrolId, patrolTitle, patrolType }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'newLeg.header' });

  const crumbs = [
    { label: t('breadcrumbPatrolsLabel'), to: `/${TAB_KEYS.PATROLS}` },
    { label: patrolTitle, to: `/${TAB_KEYS.PATROLS}/${patrolId}` },
    { label: t('breadcrumbNewLegLabel') },
  ];

  const renderTitleBar = () => <div className={styles.titleBarMain}>
    <div className={styles.icon}>
      <SvgIcon iconId={patrolType?.icon_id} title={patrolType?.display} type="patrols" />
    </div>

    <h2 className={styles.title}>{t('title')}</h2>
  </div>;

  return <PatrolsManagerHeader crumbs={crumbs} renderTitleBar={renderTitleBar} />;
};

export default memo(Header);
