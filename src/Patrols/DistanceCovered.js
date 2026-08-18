import { memo, useMemo } from 'react';
import { length } from '@turf/turf';
import { useTranslation } from 'react-i18next';

import { formatDistanceInKilometers } from '../utils/distance';
import { patrolStateAllowsTrackDisplay } from '../utils/patrols';

const PatrolDistanceCovered = ({ patrolsData = [] }) => {
  const { t } = useTranslation('utils');

  const patrolTrackLength = useMemo(() =>
    patrolsData
      .filter(({ patrol }) => !!patrolStateAllowsTrackDisplay(patrol))
      .reduce((accumulator, { trackData }) => {
        const trackLength = trackData ? length(trackData.track) : 0;

        return accumulator + trackLength;
      }, 0),
  [patrolsData]);

  return formatDistanceInKilometers(t, patrolTrackLength);
};

export default memo(PatrolDistanceCovered);
