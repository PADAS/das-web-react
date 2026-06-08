import React, { memo, useCallback, useMemo } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { formatDistance, formatDistanceToNow } from 'date-fns';

import { ReactComponent as InfoIcon } from '../common/images/icons/information.svg';
import { getCurrentLocale } from '../utils/datetime';
import {
  selectSubjectTrackLegendItemsData,
  selectSubjectTrackVisibleIds,
  selectTrackTimeEnvelope,
} from '../selectors/tracks';
import { updateTrackState } from '../ducks/map-ui';
import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';

import TrackLegend from '../TrackLegend';
import TrackDetailsTooltipContent from './TrackDetailsTooltipContent';

import * as styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const SubjectTrackLegend = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'subjectTrackLegend' });

  const subjectTrackState = useSelector((state) => state.view.subjectTrackState);
  const legendItemsData = useSelector(selectSubjectTrackLegendItemsData);
  const subjectIds = useSelector(selectSubjectTrackVisibleIds);
  const trackTimeEnvelope = useSelector(selectTrackTimeEnvelope);

  const description = useMemo(() => {
    const trackTimeEnvelopeFormatted = trackTimeEnvelope.from
      ? (trackTimeEnvelope.until
        ? formatDistance(
          new Date(trackTimeEnvelope.from),
          new Date(trackTimeEnvelope.until),
          { locale: getCurrentLocale() }
        )
        : formatDistanceToNow(new Date(trackTimeEnvelope.from), { locale: getCurrentLocale() }))
      : '';
    return trackTimeEnvelopeFormatted;
  }, [trackTimeEnvelope.from, trackTimeEnvelope.until]);

  const titleSuffix = useMemo(() => (
    <OverlayTrigger
      onEntered={() => mapInteractionTracker.track('Show Track Legend Details Popover')}
      onExited={() => mapInteractionTracker.track('Close Track Legend Details Popover')}
      overlay={
        <Popover className={styles.trackDetailsPopover} id="subject-track-details-popover">
          <Popover.Body>
            <TrackDetailsTooltipContent
              subjectIds={subjectIds}
              from={trackTimeEnvelope.from}
              until={trackTimeEnvelope.until}
            />
          </Popover.Body>
        </Popover>
      }
      placement="bottom"
      rootClose
      trigger="click"
      >
      <button
        aria-label={t('popoverTriggerLabel')}
        className={styles.infoButton}
        title={t('popoverTriggerLabel')}
        type="button"
      >
        <InfoIcon className={styles.infoIcon} />
      </button>
    </OverlayTrigger>
  ), [subjectIds, trackTimeEnvelope.from, trackTimeEnvelope.until, t]);

  const items = useMemo(() => legendItemsData.map(({ id, title, imageUrl }) => ({
    id,
    title,
    description: t('itemDescription', { count: 0 }),
    icon: <img alt={t('itemIcon', { title })} className={styles.itemIcon} src={imageUrl || ''} />,
  })), [legendItemsData, t]);

  const onRemoveSubjectTracks = useCallback((subjectId) => {
    dispatch(updateTrackState({
      pinned: subjectTrackState.pinned.filter((pinnedSubjectTracksId) => pinnedSubjectTracksId !== subjectId),
      visible: subjectTrackState.visible.filter((visibleSubjectTracksId) => visibleSubjectTracksId !== subjectId),
    }));
    mapInteractionTracker.track('Remove Subject Tracks Via Track Legend Popover');
  }, [dispatch, subjectTrackState.pinned, subjectTrackState.visible]);

  return (
    <TrackLegend
      description={description}
      items={items}
      itemsName={t('trackLegendItemsName')}
      onClickClearTracks={() => dispatch(updateTrackState({ visible: [], pinned: [] }))}
      onRemoveItemTracks={onRemoveSubjectTracks}
      titleSuffix={titleSuffix}
    />
  );
};

export default memo(SubjectTrackLegend);
