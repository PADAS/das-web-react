import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { displayDurationForPatrol } from '../../../../../utils/patrols';
import { EMPTY_VALUE } from '../../../../../constants';
import { formatDistanceInKilometers } from '../../../../../utils/distance';
import { selectPatrolLeadSumDistance } from '../../../../../selectors/patrols';

const DETAIL_SEPARATOR = ' | ';

const Details = ({ className = '', legNumber = null, patrol }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolsFeed.patrolRow' });
  const { t: tUtils } = useTranslation('utils');

  const patrolLeadSumDistance = useSelector((state) => selectPatrolLeadSumDistance(state, patrol));

  return <p className={className}>
    {legNumber > 1 && <>{t('legLabel', { number: legNumber })}{DETAIL_SEPARATOR}</>}

    {displayDurationForPatrol(patrol)}

    {DETAIL_SEPARATOR}

    {patrolLeadSumDistance === null ? EMPTY_VALUE : formatDistanceInKilometers(tUtils, patrolLeadSumDistance)}
  </p>;
};

export default memo(Details);
