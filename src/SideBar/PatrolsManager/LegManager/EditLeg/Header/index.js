import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PauseIcon } from '../../../../../common/images/icons/pause.svg';

import {
  displayTitleForPatrol,
  getIsMobilePatrol,
  governingPatrolSegment,
  isPatrolSegmentAPause,
} from '../../../../../utils/patrols';
import { PATROL_UI_STATES, TAB_KEYS } from '../../../../../constants';

import PatrolsManagerHeader from '../../../Header';
import StatusPill from '../../../StatusPill';
import SvgIcon from '../../../../../SvgIcon';

import * as styles from './styles.module.scss';

const Header = ({ legNumber, legState, patrol, patrolSegment, patrolType }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'editLeg.header' });

  // A pause is named after the pauses it is counted among, not the legs.
  const isPause = isPatrolSegmentAPause(patrolSegment);
  const legTitle = t(`title.${isPause ? 'pause' : 'leg'}`, { number: legNumber });

  const crumbs = [
    { label: t('breadcrumbPatrolsLabel'), to: `/${TAB_KEYS.PATROLS}` },
    {
      label: displayTitleForPatrol(patrol, governingPatrolSegment(patrol)?.leader),
      to: `/${TAB_KEYS.PATROLS}/${patrol.id}`,
    },
    { label: legTitle },
  ];

  const renderTitleBar = () => <>
    <div className={styles.titleBarMain}>
      <div className={styles.icon}>
        {isPause
          ? <PauseIcon aria-label={t('pauseIconLabel')} role="img" />
          : <SvgIcon iconId={patrolType?.icon_id} title={patrolType?.display} type="patrols" />}
      </div>

      <p className={styles.serialNumber}>{patrol.serial_number}</p>

      <h2 className={styles.title}>{legTitle}</h2>
    </div>

    <div className={styles.pills}>
      {getIsMobilePatrol(patrol) && <span className={styles.provenancePill}>{t('mobileProvenancePill')}</span>}

      {isPause && legState !== PATROL_UI_STATES.PAUSED && <StatusPill state={PATROL_UI_STATES.PAUSED} />}

      <StatusPill state={legState} />
    </div>
  </>;

  return <PatrolsManagerHeader crumbs={crumbs} renderTitleBar={renderTitleBar} />;
};

export default memo(Header);
