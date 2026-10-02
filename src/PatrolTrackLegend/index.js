import React, { memo, useMemo } from 'react';
import { formatDistance, formatDistanceToNow } from 'date-fns';
import omit from 'lodash/omit';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PatrolIcon } from '../common/images/icons/patrol.svg';

import { calcUrlForImage } from '../utils/img';
import { calcTitleAndSubtitleForPatrol, iconTypeForPatrol } from '../utils/patrols';
import { formatDistanceInKilometers } from '../utils/distance';
import { getCurrentLocale } from '../utils/datetime';
import { selectPatrolsWithTracksData } from '../selectors/patrols';
import { selectTrackTimeEnvelope } from '../selectors/tracks';
import { togglePatrolTrackedSubjectState, updatePatrolTrackState } from '../ducks/patrols';

import SvgIcon from '../SvgIcon';
import TrackLegend from '../TrackLegend';

import * as styles from './styles.module.scss';

const PatrolTrackLegend = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'patrolTrackLegend' });
  const { t: tUtils } = useTranslation('utils');

  const patrolsWithTrackData = useSelector(selectPatrolsWithTracksData);
  const patrolTrackState = useSelector((state) => state.view.patrolTrackState);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);
  const trackTimeEnvelope = useSelector(selectTrackTimeEnvelope);

  // The points every drawn patrol track holds, as "3 points over 2 days".
  const description = useMemo(() => {
    const patrolTracksPointCount = patrolsWithTrackData.reduce(
      (accumulator, patrolData) => accumulator + (patrolData.trackData?.points.features.length ?? 0),
      0
    );
    const trackTimeEnvelopeFormatted = trackTimeEnvelope.until
      ? formatDistance(
        new Date(trackTimeEnvelope.from),
        new Date(trackTimeEnvelope.until),
        { locale: getCurrentLocale() }
      )
      : formatDistanceToNow(new Date(trackTimeEnvelope.from), { locale: getCurrentLocale() });

    return t('description', { pointCount: patrolTracksPointCount, trackTime: trackTimeEnvelopeFormatted });
  }, [patrolsWithTrackData, t, trackTimeEnvelope.from, trackTimeEnvelope.until]);

  // One row per tracked patrol, listing the subjects whose tracks make it up.
  // Only the subjects carry a distance: summing them tells a reader nothing.
  const items = useMemo(() => patrolsWithTrackData.map((patrolData) => {
    const patrolTitle = calcTitleAndSubtitleForPatrol(patrolData.patrol, patrolTypes).title;

    return {
      children: patrolData.subjectsTrackData.map((subjectTrackData) => ({
        description: subjectTrackData.distance === null
          ? ''
          : formatDistanceInKilometers(tUtils, subjectTrackData.distance),
        icon: !!subjectTrackData.subject.image_url && <SvgIcon
          className={styles.subjectIcon}
          imageUrl={calcUrlForImage(subjectTrackData.subject.image_url)}
          title={t('subjectIcon', { subject: subjectTrackData.subject.name })}
          type="subjects"
        />,
        id: subjectTrackData.subject.id,
        isHidden: subjectTrackData.isHidden,
        title: subjectTrackData.subject.name,
        trackColor: subjectTrackData.trackData?.track?.features?.[0]?.properties?.stroke ?? '',
      })),
      icon: <SvgIcon
        className={styles.itemIcon}
        iconId={iconTypeForPatrol(patrolData.patrol)}
        title={t('icon', { patrolTitle })}
        type="patrols"
      />,
      id: patrolData.patrol.id,
      title: t('itemTitle', { patrolTitle }),
    };
  }), [patrolTypes, patrolsWithTrackData, t, tUtils]);

  return <TrackLegend
    description={description}
    items={items}
    itemsIcon={<PatrolIcon className={styles.itemsIcon} />}
    itemsName={t('trackLegendItemsName')}
    onClearItemTracks={(patrolId) => dispatch(updatePatrolTrackState({
      // A track the user turns off starts over the next time it comes back.
      hiddenSubjects: omit(patrolTrackState.hiddenSubjects, patrolId),
      pinned: patrolTrackState.pinned.filter((pinnedPatrolTracksId) => pinnedPatrolTracksId !== patrolId),
      visible: patrolTrackState.visible.filter((visiblePatrolTracksId) => visiblePatrolTracksId !== patrolId),
    }))}
    onClickClearTracks={() => dispatch(updatePatrolTrackState({ hiddenSubjects: {}, pinned: [], visible: [] }))}
    onToggleItemChildTracks={(patrolId, subjectId) => dispatch(togglePatrolTrackedSubjectState(patrolId, subjectId))}
  />;
};

export default memo(PatrolTrackLegend);
