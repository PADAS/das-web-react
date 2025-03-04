import React, { memo, useMemo } from 'react';
import { formatDistance, formatDistanceToNow } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { getCurrentLocale } from '../utils/datetime';
import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import {
  selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod,
  selectTrackTimeEnvelope,
} from '../selectors/tracks';
import { updateTrackState } from '../ducks/map-ui';

import TrackLegend from '../TrackLegend';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const SubjectTrackLegend = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'subjectTrackLegend' });

  const subjectStore = useSelector((state) => state.data.subjectStore);
  const subjectTrackState = useSelector((state) => state.view.subjectTrackState);
  const subjectTracksTrimmedToTrackTimeEnvelope =
    useSelector(selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod);
  const trackTimeEnvelope = useSelector(selectTrackTimeEnvelope);

  // Calculate the total points in the tracks to show a description in the legend like "3 points over 2 days".
  const description = useMemo(() => {
    const subjectTracksPointCount = subjectTracksTrimmedToTrackTimeEnvelope.reduce(
      (accumulator, subjectTracks) => accumulator + subjectTracks.points.features.length,
      0
    );
    const trackTimeEnvelopeFormatted = trackTimeEnvelope.until
      ? formatDistance(
        new Date(trackTimeEnvelope.from),
        new Date(trackTimeEnvelope.until),
        { locale: getCurrentLocale() }
      )
      : formatDistanceToNow(new Date(trackTimeEnvelope.from), { locale: getCurrentLocale() });

    return t('description', { pointCount: subjectTracksPointCount, trackTime: trackTimeEnvelopeFormatted });
  }, [subjectTracksTrimmedToTrackTimeEnvelope, t, trackTimeEnvelope.from, trackTimeEnvelope.until]);

  // Build the items array with the description, icon, id and title of each tracked subject.
  const items = useMemo(() => subjectTracksTrimmedToTrackTimeEnvelope.map((subjectTracks) => {
    const [firstTrackFeature] = subjectTracks.track.features;

    const id = firstTrackFeature.properties.id;
    const image = firstTrackFeature.properties.image;
    const pointCount = firstTrackFeature.geometry?.coordinates.length || 0;
    const title = firstTrackFeature.properties.title;

    const lastPositionImage = subjectStore[id]?.last_position?.properties?.image;

    return {
      description: t('itemDescription', { count: pointCount }),
      icon: <img alt={t('itemIcon', { title })} className={styles.itemIcon} src={lastPositionImage || image} />,
      id,
      title,
    };
  }), [subjectStore, subjectTracksTrimmedToTrackTimeEnvelope, t]);

  const onRemoveSubjectTracks = (subjectId) => {
    dispatch(updateTrackState({
      pinned: subjectTrackState.pinned.filter((pinnedSubjectTracksId) => pinnedSubjectTracksId !== subjectId),
      visible: subjectTrackState.visible.filter((visibleSubjectTracksId) => visibleSubjectTracksId !== subjectId),
    }));

    mapInteractionTracker.track('Remove Subject Tracks Via Track Legend Popover');
  };

  return <TrackLegend
    description={description}
    items={items}
    itemsName={t('trackLegendItemsName')}
    onClickClearTracks={() => dispatch(updateTrackState({ visible: [], pinned: [] }))}
    onRemoveItemTracks={onRemoveSubjectTracks}
  />;
};

export default memo(SubjectTrackLegend);
