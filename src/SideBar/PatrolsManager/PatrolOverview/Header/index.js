import React, { memo, useContext, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClipIcon } from '../../../../common/images/icons/link.svg';
import { ReactComponent as DownloadArrowIcon } from '../../../../common/images/icons/download-arrow.svg';
import { ReactComponent as FitScreenIcon } from '../../../../common/images/icons/fit-screen.svg';
import { ReactComponent as MarkerFeedIcon } from '../../../../common/images/icons/marker-feed.svg';
import { ReactComponent as PrinterIcon } from '../../../../common/images/icons/printer-outline.svg';
import { ReactComponent as TrackIcon } from '../../../../common/images/icons/tracks_off.svg';

import { basePrintingStyles } from '../../../../utils/styles';
import {
  getBoundsForPatrol,
  getIsMobilePatrol,
  getPatrolLocationCoordinates,
  iconIdForPatrolSegment,
  patrolHasTrackData,
} from '../../../../utils/patrols';
import { DAS_HOST, TAB_KEYS } from '../../../../constants';
import { downloadJsonAsFile } from '../../../../utils/download';
import { selectPatrolTrackData } from '../../../../selectors/patrols';
import { togglePatrolTrackState } from '../../../../ducks/patrols';
import { TrackerContext } from '../../../../utils/analytics';
import useJumpToLocation from '../../../../hooks/useJumpToLocation';

import KebabMenu from '../../../../KebabMenu';
import PatrolsManagerHeader from '../../Header';
import StatusSelect from './StatusSelect';
import SvgIcon from '../../../../SvgIcon';
import TitleInput from '../../TitleInput';

import * as styles from './styles.module.scss';

const COPY_LINK_TOAST_AUTOCLOSE = 2000;

const Header = ({
  isStateDirty,
  isTitleDirty,
  onChangeState,
  onChangeTitle,
  patrol,
  patrolState,
  printableContentRef,
  state,
  title,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.header' });

  const tracker = useContext(TrackerContext);

  const jumpToLocation = useJumpToLocation();

  const lastSegment = patrol.patrol_segments[patrol.patrol_segments.length - 1] ?? null;

  const patrolTrackData = useSelector((state) => selectPatrolTrackData(state, patrol));
  const patrolTrackState = useSelector((state) => state.view.patrolTrackState);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const crumbs = useMemo(
    () => [{ label: t('breadcrumbPatrolsLabel'), to: `/${TAB_KEYS.PATROLS}` }, { label: title }],
    [t, title]
  );

  const patrolIconId = lastSegment ? iconIdForPatrolSegment(patrolTypes, lastSegment) : null;

  const isPatrolTrackPinned = patrolTrackState.pinned.includes(patrol.id);
  const isPatrolTrackVisible = !isPatrolTrackPinned && patrolTrackState.visible.includes(patrol.id);

  const trackToggleState = isPatrolTrackPinned ? 'pinned' : isPatrolTrackVisible ? 'visible' : 'hidden';
  const nextTrackToggleStateIfToggled = isPatrolTrackPinned ? 'hidden' : isPatrolTrackVisible ? 'pinned' : 'visible';

  // TODO: The patrol track toggle only shows each leg leader's track. Once team members and
  // assets are available from the endpoint, it should also include their tracks bounded to
  // the leg's time range.
  const hasTrack = patrolHasTrackData(patrolTrackData);

  const jumpToLocationCoordinates = getPatrolLocationCoordinates(patrolTrackData);

  // TODO: Zoom to patrol bounds only accounts for the leg leader's track/position. Once team
  // members and assets are available from the endpoint, their tracks bounded to the leg's
  // time range should also be included in the bounds.
  const patrolBounds = useMemo(() => getBoundsForPatrol(patrol, patrolTrackData), [patrol, patrolTrackData]);

  const onToggleTrack = () => {
    dispatch(togglePatrolTrackState(patrol.id));

    tracker.track(`Toggle patrol track state to ${nextTrackToggleStateIfToggled} from patrol overview`);
  };

  const onJumpToLocation = () => {
    jumpToLocation(jumpToLocationCoordinates);

    tracker.track('Click "jump to location" from patrol overview');
  };

  const onFitToBounds = () => {
    jumpToLocation([[patrolBounds[0], patrolBounds[1]], [patrolBounds[2], patrolBounds[3]]], undefined, { maxZoom: 17 });

    tracker.track('Click "fit to bounds" from patrol overview');
  };

  const onCopyLink = async () => {
    try {
      await window.navigator.clipboard.writeText(`${DAS_HOST}/patrols/${patrol.id}`);

      toast.info(t('copyLinkMessage'), { autoClose: COPY_LINK_TOAST_AUTOCLOSE, hideProgressBar: true });

      tracker.track('Copy patrol link from patrol overview');
    } catch (error) {
      console.warn('Error copying patrol link to clipboard: ', error);
    }
  };

  const onPrint = useReactToPrint({
    contentRef: printableContentRef,
    documentTitle: `${patrol.serial_number ?? ''} ${title}`.trim(),
    pageStyle: basePrintingStyles,
  });

  const onDownloadTrack = () => {
    downloadJsonAsFile(patrolTrackData.trackData.track, `Patrol_${patrol.serial_number}.geojson`);

    tracker.track('Download patrol track from patrol overview');
  };

  const renderActions = () => <>
    <div className={styles.desktopActions}>
      <button
        aria-label={t(`toggleTrackButtonLabel.${trackToggleState}`)}
        aria-pressed={isPatrolTrackPinned ? 'true' : isPatrolTrackVisible ? 'mixed' : 'false'}
        className={`${styles.iconButton} ${styles.toggleTrackButton} ${
          isPatrolTrackPinned ? styles.pinned : isPatrolTrackVisible ? styles.visible : ''
        }`}
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

      <button
        aria-label={t('fitToBoundsButtonLabel')}
        className={styles.iconButton}
        disabled={!patrolBounds}
        onClick={onFitToBounds}
        title={t('fitToBoundsButtonLabel')}
        type="button"
      >
        <FitScreenIcon aria-hidden="true" />
      </button>
    </div>

    <KebabMenu
        aria-label={t('moreOptionsButtonLabel')}
        align="end"
        title={t('moreOptionsButtonLabel')}
      >
      <KebabMenu.Option
        className={styles.mobileOnlyOption}
        disabled={!hasTrack}
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
        disabled={!patrolBounds}
        onClick={onFitToBounds}
      >
        <FitScreenIcon aria-hidden="true" />

        {t('fitToBoundsButtonLabel')}
      </KebabMenu.Option>

      <KebabMenu.Divider className={styles.mobileOnlyOption} />

      <KebabMenu.Option onClick={onCopyLink}>
        <ClipIcon aria-hidden="true" />

        {t('copyLinkOption')}
      </KebabMenu.Option>

      <KebabMenu.Option onClick={onPrint}>
        <PrinterIcon aria-hidden="true" />

        {t('printOption')}
      </KebabMenu.Option>

      <KebabMenu.Option disabled={!hasTrack} onClick={onDownloadTrack}>
        <DownloadArrowIcon aria-hidden="true" />

        {t('downloadTrackOption')}
      </KebabMenu.Option>
    </KebabMenu>
  </>;

  const renderTitleBar = () => <>
    <div className={styles.titleBarMain}>
      <div className={styles.icon}>
        <SvgIcon iconId={patrolIconId} type="patrols" />
      </div>

      <p className={styles.serialNumber}>{patrol.serial_number}</p>

      <TitleInput
        aria-label={t('titleInputLabel')}
        data-testid="patrolOverview-title"
        isDirty={isTitleDirty}
        onChange={onChangeTitle}
        value={title}
      />
    </div>

    <div className={styles.pills}>
      {getIsMobilePatrol(patrol) && <span className={styles.provenancePill}>{t('mobileProvenancePill')}</span>}

      <StatusSelect
        isDirty={isStateDirty}
        onSelect={onChangeState}
        patrol={patrol}
        patrolState={patrolState}
        state={state}
      />
    </div>
  </>;

  return <PatrolsManagerHeader crumbs={crumbs} renderActions={renderActions} renderTitleBar={renderTitleBar} />;
};

export default memo(Header);
