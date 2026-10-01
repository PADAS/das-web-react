import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcTitleAndSubtitleForPatrol } from '../../../../../utils/patrols';
import { TAB_KEYS } from '../../../../../constants';

import DetailViewHeader from '../../../../DetailViewHeader';
import SvgIcon from '../../../../../SvgIcon';

import * as styles from './styles.module.scss';

const Header = ({ patrol, patrolType }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'newLeg.header' });
  const { t: tHeader } = useTranslation('patrols', { keyPrefix: 'header' });

  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const crumbs = [
    { label: t('breadcrumbPatrolsLabel'), to: `/${TAB_KEYS.PATROLS}` },
    { label: calcTitleAndSubtitleForPatrol(patrol, patrolTypes).title, to: `/${TAB_KEYS.PATROLS}/${patrol.id}` },
    { label: t('breadcrumbNewLegLabel') },
  ];

  const renderTitleBar = () => <>
    <div className={styles.titleBarMain}>
      <div className={`${styles.icon} ${styles.new}`} data-testid="newLegHeader-icon">
        <SvgIcon iconId={patrolType?.icon_id} title={patrolType?.display} type="patrols" />
      </div>

      <p className={styles.serialNumber}>{patrol.serial_number}</p>

      <div className={styles.titleStack}>
        <h2 className={styles.title}>{t('title')}</h2>

        {!!patrolType && <p className={styles.subtitle}>{patrolType.display}</p>}
      </div>
    </div>

    <div className={styles.pills}>
      <span className={styles.statePill}>{t('statePill')}</span>
    </div>
  </>;

  return <DetailViewHeader
    breadcrumbLabel={tHeader('breadcrumbNavLabel')}
    crumbs={crumbs}
    renderTitleBar={renderTitleBar}
  />;
};

export default memo(Header);
