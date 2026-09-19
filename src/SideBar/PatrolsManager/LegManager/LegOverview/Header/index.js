import React, { memo, useContext, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClipIcon } from '../../../../../common/images/icons/link.svg';
import { ReactComponent as DownloadArrowIcon } from '../../../../../common/images/icons/download-arrow.svg';
import { ReactComponent as FitScreenIcon } from '../../../../../common/images/icons/fit-screen.svg';
import { ReactComponent as MarkerFeedIcon } from '../../../../../common/images/icons/marker-feed.svg';
import { ReactComponent as PauseIcon } from '../../../../../common/images/icons/pause.svg';
import { ReactComponent as PrinterIcon } from '../../../../../common/images/icons/printer-outline.svg';
import { ReactComponent as TrackIcon } from '../../../../../common/images/icons/tracks_off.svg';

import { basePrintingStyles } from '../../../../../utils/styles';
import { DAS_HOST, PATROL_UI_STATES, TAB_KEYS } from '../../../../../constants';
import {
  displayNameForPatrolSegment,
  displayTitleForPatrol,
  getBoundsForPatrolSegment,
  getIsMobilePatrol,
  getPatrolSegmentLocationCoordinates,
  governingPatrolSegment,
  iconIdForPatrolSegment,
  isPatrolSegmentAPause,
  patrolHasTrackData,
  patrolSegmentHasTrackData,
} from '../../../../../utils/patrols';
import { downloadJsonAsFile } from '../../../../../utils/download';
import { selectPatrolSegmentsTrackData, selectPatrolTrackData } from '../../../../../selectors/patrols';
import { togglePatrolTrackState } from '../../../../../ducks/patrols';
import { TrackerContext } from '../../../../../utils/analytics';
import useJumpToLocation from '../../../../../hooks/useJumpToLocation';

import KebabMenu from '../../../../../KebabMenu';
import PatrolsManagerHeader from '../../../Header';
import StatusPill from '../../../StatusPill';
import SvgIcon from '../../../../../SvgIcon';

import * as styles from './styles.module.scss';

const COPY_LINK_TOAST_AUTOCLOSE = 2000;

const FIT_TO_BOUNDS_MAX_ZOOM = 17;

const Header = ({ legNumber, legState, patrol, patrolSegment, printableContentRef }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('patrols', { keyPrefix: 'legOverview.header' });

  const tracker = useContext(TrackerContext);

  const jumpToLocation = useJumpToLocation();

  const patrolSegmentsTrackData = useSelector((state) => selectPatrolSegmentsTrackData(state, patrol));
  const patrolTrackData = useSelector((state) => selectPatrolTrackData(state, patrol));
  const patrolTrackState = useSelector((state) => state.view.patrolTrackState);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const legTrackData = patrolSegmentsTrackData[patrol.patrol_segments.indexOf(patrolSegment)] ?? null;

  // A pause is named after the pauses it is counted among, not the legs.
  const isPause = isPatrolSegmentAPause(patrolSegment);
  const legKind = isPause ? 'pause' : 'leg';
  const legTitle = t(`title.${legKind}`, { number: legNumber });

  const crumbs = [
    { label: t('breadcrumbPatrolsLabel'), to: `/${TAB_KEYS.PATROLS}` },
    {
      label: displayTitleForPatrol(patrol, governingPatrolSegment(patrol)?.leader),
      to: `/${TAB_KEYS.PATROLS}/${patrol.id}`,
    },
    { label: legTitle },
  ];

  const legIconId = iconIdForPatrolSegment(patrolTypes, patrolSegment);
  const patrolTypeName = displayNameForPatrolSegment(patrolTypes, patrolSegment);

  const isPatrolTrackPinned = patrolTrackState.pinned.includes(patrol.id);
  const isPatrolTrackVisible = !isPatrolTrackPinned && patrolTrackState.visible.includes(patrol.id);

  const trackToggleState = isPatrolTrackPinned ? 'pinned' : isPatrolTrackVisible ? 'visible' : 'hidden';
  const nextTrackToggleStateIfToggled = isPatrolTrackPinned ? 'hidden' : isPatrolTrackVisible ? 'pinned' : 'visible';

  // The toggle acts on the whole patrol, so what the patrol has to show is what
  // decides it; downloading the leg's own track needs the leg to have one.
  const hasPatrolTrack = patrolHasTrackData(patrolTrackData);
  const hasLegTrack = patrolSegmentHasTrackData(legTrackData);

  const jumpToLocationCoordinates = getPatrolSegmentLocationCoordinates(patrolSegment, legTrackData);

  const legBounds = useMemo(
    () => getBoundsForPatrolSegment(patrolSegment, legTrackData),
    [legTrackData, patrolSegment]
  );

  // Track visibility is a patrol wide setting.
  const onToggleTrack = () => {
    dispatch(togglePatrolTrackState(patrol.id));

    tracker.track(`Toggle patrol track state to ${nextTrackToggleStateIfToggled} from leg overview`);
  };

  const onJumpToLocation = () => {
    jumpToLocation(jumpToLocationCoordinates);

    tracker.track('Click "jump to location" from leg overview');
  };

  const onFitToBounds = () => {
    jumpToLocation(
      [[legBounds[0], legBounds[1]], [legBounds[2], legBounds[3]]],
      undefined,
      { maxZoom: FIT_TO_BOUNDS_MAX_ZOOM }
    );

    tracker.track('Click "fit to bounds" from leg overview');
  };

  const onCopyLink = async () => {
    try {
      await window.navigator.clipboard.writeText(
        `${DAS_HOST}/${TAB_KEYS.PATROLS}/${patrol.id}/legs/${patrolSegment.id}`
      );

      toast.info(t('copyLinkMessage'), { autoClose: COPY_LINK_TOAST_AUTOCLOSE, hideProgressBar: true });

      tracker.track('Copy leg link from leg overview');
    } catch (error) {
      console.warn('Error copying leg link to clipboard: ', error);
    }
  };

  const onPrint = useReactToPrint({
    contentRef: printableContentRef,
    documentTitle: `${patrol.serial_number ?? ''} ${legTitle}`.trim(),
    pageStyle: basePrintingStyles,
  });

  const onDownloadTrack = () => {
    downloadJsonAsFile(
      legTrackData.track,
      `Patrol_${patrol.serial_number}_${isPause ? 'Pause' : 'Leg'}_${legNumber}.geojson`
    );

    tracker.track('Download leg track from leg overview');
  };

  // A pause has no track to follow, frame, download or jump to the end of. The
  // locations it was logged at are in its plan, with jumps of their own.
  const renderActions = () => <>
    {!isPause && <div className={styles.desktopActions}>
      <button
        aria-label={t(`toggleTrackButtonLabel.${trackToggleState}`)}
        aria-pressed={isPatrolTrackPinned ? 'true' : isPatrolTrackVisible ? 'mixed' : 'false'}
        className={`${styles.iconButton} ${styles.toggleTrackButton} ${
          isPatrolTrackPinned ? styles.pinned : isPatrolTrackVisible ? styles.visible : ''
        }`}
        disabled={!hasPatrolTrack}
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

      <button
        aria-label={t('fitToBoundsButtonLabel')}
        className={styles.iconButton}
        disabled={!legBounds}
        onClick={onFitToBounds}
        title={t('fitToBoundsButtonLabel')}
        type="button"
      >
        <FitScreenIcon aria-hidden="true" />
      </button>
    </div>}

    <KebabMenu
      align="end"
      aria-label={t('moreOptionsButtonLabel')}
      title={t('moreOptionsButtonLabel')}
      >
      {!isPause && <>
        <KebabMenu.Option
          className={styles.mobileOnlyOption}
          disabled={!hasPatrolTrack}
          onClick={onToggleTrack}
        >
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

        <KebabMenu.Option
          className={styles.mobileOnlyOption}
          disabled={!legBounds}
          onClick={onFitToBounds}
        >
          <FitScreenIcon aria-hidden="true" />

          {t('fitToBoundsButtonLabel')}
        </KebabMenu.Option>

        <KebabMenu.Divider className={styles.mobileOnlyOption} />
      </>}

      <KebabMenu.Option onClick={onCopyLink}>
        <ClipIcon aria-hidden="true" />

        {t(`copyLinkOption.${legKind}`)}
      </KebabMenu.Option>

      <KebabMenu.Option onClick={onPrint}>
        <PrinterIcon aria-hidden="true" />

        {t(`printOption.${legKind}`)}
      </KebabMenu.Option>

      {!isPause && <KebabMenu.Option disabled={!hasLegTrack} onClick={onDownloadTrack}>
        <DownloadArrowIcon aria-hidden="true" />

        {t('downloadTrackOption')}
      </KebabMenu.Option>}
    </KebabMenu>
  </>;

  const renderTitleBar = () => <>
    <div className={styles.titleBarMain}>
      <div className={styles.icon}>
        {isPause
          ? <PauseIcon aria-label={t('pauseIconLabel')} role="img" />
          : <SvgIcon iconId={legIconId} title={patrolTypeName} type="patrols" />}
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

  return <PatrolsManagerHeader crumbs={crumbs} renderActions={renderActions} renderTitleBar={renderTitleBar} />;
};

export default memo(Header);
