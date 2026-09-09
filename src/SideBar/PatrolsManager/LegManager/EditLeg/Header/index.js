import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  displayTitleForPatrol,
  getIsMobilePatrol,
  governingPatrolSegment,
  isPatrolSegmentAPause,
} from '../../../../../utils/patrols';
import { PATROL_UI_STATES, TAB_KEYS } from '../../../../../constants';

import PatrolsManagerHeader from '../../../Header';
import StatusPill from '../../../StatusPill';

import * as styles from './styles.module.scss';

const Header = ({ legNumber, legState, patrol, patrolSegment }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'editLeg.header' });

  const crumbs = [
    { label: t('breadcrumbPatrolsLabel'), to: `/${TAB_KEYS.PATROLS}` },
    {
      label: displayTitleForPatrol(patrol, governingPatrolSegment(patrol)?.leader),
      to: `/${TAB_KEYS.PATROLS}/${patrol.id}`,
    },
    { label: t('title', { legNumber }) },
  ];

  const renderTitleBar = () => <>
    <h2 className={styles.title}>{t('title', { legNumber })}</h2>

    <div className={styles.pills}>
      {getIsMobilePatrol(patrol) && <span className={styles.provenancePill}>{t('mobileProvenancePill')}</span>}

      {isPatrolSegmentAPause(patrolSegment) && legState !== PATROL_UI_STATES.PAUSED
        && <StatusPill state={PATROL_UI_STATES.PAUSED} />}

      <StatusPill state={legState} />
    </div>
  </>;

  return <PatrolsManagerHeader crumbs={crumbs} renderTitleBar={renderTitleBar} />;
};

export default memo(Header);
