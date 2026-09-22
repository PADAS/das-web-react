import React, { memo, useContext, useEffect, useMemo, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClipIcon } from '../../../../../common/images/icons/link.svg';
import { ReactComponent as DownloadArrowIcon } from '../../../../../common/images/icons/download-arrow.svg';
import { ReactComponent as MarkerFeedIcon } from '../../../../../common/images/icons/marker-feed.svg';
import { ReactComponent as TrackIcon } from '../../../../../common/images/icons/tracks_off.svg';

import {
  actualEndTimeForPatrol,
  actualStartTimeForPatrol,
  getPatrolLocationCoordinates,
  patrolHasTrackData,
} from '../../../../../utils/patrols';
import buildPatrolStatusUpdate from '../../../utils/buildPatrolStatusUpdate';
import { DAS_HOST } from '../../../../../constants';
import { downloadJsonAsFile } from '../../../../../utils/download';
import { fetchTracksIfNecessary } from '../../../../../utils/tracks';
import getPatrolStatusOptions from '../../../utils/getPatrolStatusOptions';
import getPatrolStatusTransition from '../../../utils/getPatrolStatusTransition';
import { selectPatrolMeasuredSubjectIds, selectPatrolTrackData } from '../../../../../selectors/patrols';
import { togglePatrolTrackState, updatePatrol } from '../../../../../ducks/patrols';
import { TrackerContext } from '../../../../../utils/analytics';
import useJumpToLocation from '../../../../../hooks/useJumpToLocation';
import { usePatrolsPermissions } from '../../../../../hooks/usePermissions';

import KebabMenu from '../../../../../KebabMenu';

import * as styles from './styles.module.scss';

const COPY_LINK_TOAST_AUTOCLOSE = 2000;

const EMPTY_STATUS_TRANSITIONS = [];

// A row settles before it asks for anything, so the tracks of a feed that is
// still being scrolled or filtered are never fetched.
const TRACK_FETCH_DEBOUNCE_DELAY = 150;

const TRACK_STATES = { HIDDEN: 'hidden', PINNED: 'pinned', VISIBLE: 'visible' };

const NEXT_TRACK_STATE_BY_TRACK_STATE = {
  [TRACK_STATES.HIDDEN]: TRACK_STATES.VISIBLE,
  [TRACK_STATES.PINNED]: TRACK_STATES.HIDDEN,
  [TRACK_STATES.VISIBLE]: TRACK_STATES.PINNED,
};

// The map draws a pinned track above a visible one, so pinning outranks it.
const trackStateForPatrol = (patrolTrackState, patrolId) => {
  if (patrolTrackState.pinned.includes(patrolId)) {
    return TRACK_STATES.PINNED;
  }

  return patrolTrackState.visible.includes(patrolId) ? TRACK_STATES.VISIBLE : TRACK_STATES.HIDDEN;
};

// The options lead with the patrol's own state, which is no move to make.
const getStatusTransitions = (patrol, patrolState) => getPatrolStatusOptions(patrol, patrolState)
  .map((state) => ({ state, transition: getPatrolStatusTransition(patrolState, state) }))
  .filter((statusTransition) => !!statusTransition.transition);

const Actions = ({ className = '', patrol, patrolState }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolsFeed.patrolRow.actions' });
  const { t: tStatusTransitions } = useTranslation('patrols', { keyPrefix: 'statusTransitions' });

  const tracker = useContext(TrackerContext);

  const jumpToLocation = useJumpToLocation();
  const { hasPatrolsUpdatePermission } = usePatrolsPermissions();

  // The row reports only the patrol's distance, so it fetches what that is read
  // from. Its identity has to hold, or the debounce below never settles.
  const patrolMeasuredSubjectIds = useSelector(
    (state) => selectPatrolMeasuredSubjectIds(state, patrol),
    shallowEqual
  );
  const patrolTrackData = useSelector((state) => selectPatrolTrackData(state, patrol));
  const trackToggleState = useSelector((state) => trackStateForPatrol(state.view.patrolTrackState, patrol.id));

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const hasTrack = patrolHasTrackData(patrolTrackData);

  const jumpToLocationCoordinates = getPatrolLocationCoordinates(patrolTrackData);

  // Every tracked subject of a patrol can be hidden from the track legend,
  // which leaves it with a track it has nothing to draw or hand over.
  const shownTrack = patrolTrackData.trackData?.track ?? null;

  const trackFetchSince = actualStartTimeForPatrol(patrol)?.toISOString() ?? null;
  const trackFetchUntil = actualEndTimeForPatrol(patrol)?.toISOString() ?? null;

  // A row is rebuilt whenever anything about its patrol lands, so the moves it
  // offers are held rather than speculated on again for a menu nobody opened.
  const statusTransitions = useMemo(
    () => hasPatrolsUpdatePermission ? getStatusTransitions(patrol, patrolState) : EMPTY_STATUS_TRANSITIONS,
    [hasPatrolsUpdatePermission, patrol, patrolState]
  );

  const onCopyLink = async () => {
    try {
      await window.navigator.clipboard.writeText(`${DAS_HOST}/patrols/${patrol.id}`);

      toast.info(t('copyLinkMessage'), { autoClose: COPY_LINK_TOAST_AUTOCLOSE, hideProgressBar: true });

      tracker.track('Copy patrol link from the patrols feed');
    } catch (error) {
      console.warn('Error copying patrol link to clipboard: ', error);
    }
  };

  const onDownloadTrack = () => {
    downloadJsonAsFile(shownTrack, `Patrol_${patrol.serial_number}.geojson`);

    tracker.track('Download patrol track from the patrols feed');
  };

  const onJumpToLocation = () => {
    jumpToLocation(jumpToLocationCoordinates);

    tracker.track('Click "jump to location" from the patrols feed');
  };

  const onSelectStatus = async (pickedState) => {
    setIsUpdatingStatus(true);

    try {
      await dispatch(updatePatrol({ ...buildPatrolStatusUpdate(patrol, pickedState), id: patrol.id }));

      tracker.track(`Pick the "${pickedState.key}" patrol status from the patrols feed`);
    } catch (error) {
      toast.error(t('statusUpdateErrorMessage'));

      console.warn('Error updating a patrol status from the patrols feed: ', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const onToggleTrack = () => {
    dispatch(togglePatrolTrackState(patrol.id));

    tracker.track(
      `Toggle patrol track state to ${NEXT_TRACK_STATE_BY_TRACK_STATE[trackToggleState]} from the patrols feed`
    );
  };

  useEffect(() => {
    if (patrolMeasuredSubjectIds.length > 0) {
      const timeoutId = window.setTimeout(() => fetchTracksIfNecessary(
        patrolMeasuredSubjectIds,
        { optionalDateBoundaries: { since: trackFetchSince, until: trackFetchUntil } }
      ), TRACK_FETCH_DEBOUNCE_DELAY);

      return () => window.clearTimeout(timeoutId);
    }
  }, [patrolMeasuredSubjectIds, trackFetchSince, trackFetchUntil]);

  return <div className={className}>
    <div className={styles.desktopActions}>
      <button
        aria-label={t(`toggleTrackButtonLabel.${trackToggleState}`)}
        className={`${styles.iconButton} ${styles.toggleTrackButton} ${styles[trackToggleState] ?? ''}`}
        disabled={!hasTrack}
        onClick={onToggleTrack}
        title={t(`toggleTrackButtonLabel.${trackToggleState}`)}
        type="button"
      >
        <TrackIcon aria-hidden="true" />
      </button>

      <button
        aria-label={t('jumpToLocationButtonLabel')}
        className={styles.iconButton}
        disabled={!jumpToLocationCoordinates}
        onClick={onJumpToLocation}
        title={t('jumpToLocationButtonLabel')}
        type="button"
      >
        <MarkerFeedIcon aria-hidden="true" />
      </button>
    </div>

    <KebabMenu
      align="end"
      aria-label={t('moreOptionsButtonLabel')}
      isLoading={isUpdatingStatus}
      title={t('moreOptionsButtonLabel')}
    >
      {statusTransitions.map((statusTransition) => <KebabMenu.Option
        key={statusTransition.state.key}
        onClick={() => onSelectStatus(statusTransition.state)}
      >
        {tStatusTransitions(statusTransition.transition)}
      </KebabMenu.Option>)}

      {statusTransitions.length > 0 && <KebabMenu.Divider />}

      <KebabMenu.Option className={styles.mobileOnlyOption} disabled={!hasTrack} onClick={onToggleTrack}>
        <TrackIcon aria-hidden="true" />

        {t(`toggleTrackButtonLabel.${trackToggleState}`)}
      </KebabMenu.Option>

      <KebabMenu.Option
        className={styles.mobileOnlyOption}
        disabled={!jumpToLocationCoordinates}
        onClick={onJumpToLocation}
      >
        <MarkerFeedIcon aria-hidden="true" />

        {t('jumpToLocationButtonLabel')}
      </KebabMenu.Option>

      <KebabMenu.Divider className={styles.mobileOnlyOption} />

      <KebabMenu.Option onClick={onCopyLink}>
        <ClipIcon aria-hidden="true" />

        {t('copyLinkOption')}
      </KebabMenu.Option>

      <KebabMenu.Option disabled={!shownTrack} onClick={onDownloadTrack}>
        <DownloadArrowIcon aria-hidden="true" />

        {t('downloadTrackOption')}
      </KebabMenu.Option>
    </KebabMenu>
  </div>;
};

export default memo(Actions);
