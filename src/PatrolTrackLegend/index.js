import React, { memo, useMemo } from 'react';
import { length } from '@turf/turf';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { displayTitleForPatrol, iconTypeForPatrol, patrolStateAllowsTrackDisplay } from '../utils/patrols';
import { selectPatrolsWithTracksData } from '../selectors/patrols';
import { updatePatrolTrackState } from '../ducks/patrols';

import SvgIcon from '../SvgIcon';
import TrackLegend from '../TrackLegend';

import * as styles from './styles.module.scss';

const PatrolTrackLegend = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'patrolTrackLegend' });

  const patrolTrackState = useSelector((state) => state.view.patrolTrackState);
  const patrolsWithTrackData = useSelector(selectPatrolsWithTracksData);

  // Calculate the total tracks length to show a description in the legend like "3km".
  const description = useMemo(() => {
    const totalTracksLength = patrolsWithTrackData
      .filter((patrolData) => !!patrolStateAllowsTrackDisplay(patrolData.patrol))
      .reduce((accumulator, patrolData) => {
        const lineLength = patrolData.startStopGeometries?.lines ? length(patrolData.startStopGeometries.lines) : 0;
        const trackLength = patrolData.trackData?.track ? length(patrolData.trackData.track) : 0;

        return accumulator + lineLength + trackLength;
      }, 0);

    return `${totalTracksLength ? totalTracksLength.toFixed(2) : 0}km`;
  }, [patrolsWithTrackData]);

  // Build the items array with the description, icon, id and title of each tracked patrol.
  const items = useMemo(() => patrolsWithTrackData.map((patrolData) => {
    const iconId = iconTypeForPatrol(patrolData.patrol);
    const patrolTitle = displayTitleForPatrol(patrolData.patrol, patrolData.leader);

    return {
      description: `${patrolData.trackData ? length(patrolData.trackData.track).toFixed(2): 0.00}km`,
      icon: <SvgIcon
        className={styles.itemIcon}
        iconId={iconId}
        title={t('icon', { patrolTitle })}
        type="patrols"
      />,
      id: patrolData.patrol.id,
      title: t('itemTitle', { patrolTitle }),
    };
  }), [patrolsWithTrackData, t]);

  return <TrackLegend
    description={description}
    items={items}
    itemsName={t('trackLegendItemsName')}
    onClickClearTracks={() => dispatch(updatePatrolTrackState({ visible: [], pinned: [] }))}
    onRemoveItemTracks={(patrolId) => dispatch(updatePatrolTrackState({
      pinned: patrolTrackState.pinned.filter((pinnedPatrolTracksId) => pinnedPatrolTracksId !== patrolId),
      visible: patrolTrackState.visible.filter((visiblePatrolTracksId) => visiblePatrolTracksId !== patrolId),
    }))}
    showTimeOfDaySettings={false}
    showTrackSettings={false}
  />;
};

export default memo(PatrolTrackLegend);
