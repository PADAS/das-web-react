import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { formatDistance, formatDistanceToNow } from 'date-fns';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as InfoIcon } from '../common/images/icons/information.svg';
import { TRACKS_API_URL } from '../ducks/tracks';
import { getCurrentLocale, format, STANDARD_DATE_FORMAT } from '../utils/datetime';
import { countTrackPointsInFeatureCollection } from '../utils/tracks';
import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import {
  selectSubjectTrackLegendItemsData,
  selectSubjectTrackVisibleIds,
  selectTrackTimeEnvelope,
} from '../selectors/tracks';
import { updateTrackState } from '../ducks/map-ui';

import TrackLegend from '../TrackLegend';

import * as styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

/**
 * Fetches track GeoJSON for the given subjects and date range, counts points, then discards the response.
 * Returns total point count; does not store GeoJSON (no memory bloat).
 */
const fetchTrackPointCount = async (subjectIds, from, until, signal) => {
  if (!subjectIds?.length || !from) return 0;
  const since = from.toISOString();
  const untilParam = until ? until.toISOString() : new Date().toISOString();
  const params = { since, until: untilParam };
  const responses = await Promise.all(
    subjectIds.map((id) => axios.get(TRACKS_API_URL(id), { params, signal }))
  );
  let total = 0;
  for (const res of responses) {
    const fc = res?.data?.data;
    if (fc) total += countTrackPointsInFeatureCollection(fc);
  }
  return total;
};

const TrackDetailsTooltipContent = memo(function TrackDetailsTooltipContent({
  subjectIds,
  from,
  until,
  tTooltip,
}) {
  const [state, setState] = useState({ status: 'loading', count: null, error: null });
  const mountedRef = useRef(true);
  const subjectIdsKey = subjectIds?.length ? subjectIds.slice().sort().join(',') : '';

  useEffect(() => {
    mountedRef.current = true;
    if (!subjectIdsKey || !from) {
      setState({ status: 'idle', count: 0, error: null });
      return () => { mountedRef.current = false; };
    }
    const controller = new AbortController();
    fetchTrackPointCount(subjectIds, from, until || new Date(), controller.signal)
      .then((count) => {
        if (mountedRef.current) setState({ status: 'success', count, error: null });
      })
      .catch((err) => {
        const isAborted = err?.name === 'AbortError' || err?.name === 'CanceledError' || axios.isCancel(err);
        if (mountedRef.current && !isAborted) {
          setState({ status: 'error', count: null, error: err });
        }
      });
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [subjectIdsKey, from, until]);

  const fromFormatted = from ? format(new Date(from), STANDARD_DATE_FORMAT) : '';
  const untilFormatted = until ? format(new Date(until), STANDARD_DATE_FORMAT) : tTooltip('untilNow');

  return (
    <div className={styles.popoverContent}>
      <div>{tTooltip('dateRange', { from: fromFormatted, until: untilFormatted })}</div>
      <div>
        {state.status === 'loading' && tTooltip('pointCountLoading')}
        {state.status === 'success' && tTooltip('pointCount', { count: state.count })}
        {state.status === 'error' && tTooltip('pointCountError')}
      </div>
    </div>
  );
});

const SubjectTrackLegend = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'subjectTrackLegend' });
  const { t: tTooltip } = useTranslation('tracks', { keyPrefix: 'subjectTrackLegend.tooltip' });

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
    return t('description', { trackTime: trackTimeEnvelopeFormatted });
  }, [t, trackTimeEnvelope.from, trackTimeEnvelope.until]);

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
              tTooltip={tTooltip}
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
  ), [subjectIds, trackTimeEnvelope.from, trackTimeEnvelope.until, t, tTooltip]);

  // Build legend items from subjectStore (no dependency on fetched track GeoJSON).
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
