import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ChevronRightIcon } from '../../../../common/images/icons/chevron-right.svg';
import { ReactComponent as CrossIcon } from '../../../../common/images/icons/cross.svg';
import { ReactComponent as FitScreenIcon } from '../../../../common/images/icons/fit-screen.svg';
import { ReactComponent as MarkerFeedIcon } from '../../../../common/images/icons/marker-feed.svg';
import { ReactComponent as PencilIcon } from '../../../../common/images/icons/pencil.svg';
import { ReactComponent as TrackIcon } from '../../../../common/images/icons/tracks_off.svg';

import { basePrintingStyles } from '../../../../utils/styles';
import {
  calcPatrolState,
  displayTitleForPatrol,
  getBoundsForPatrol,
  iconIdForPatrolSegment,
  patrolHasGeoDataToDisplay,
} from '../../../../utils/patrols';
import { downloadFileFromUrl } from '../../../../utils/download';
import { selectPatrolTrackData } from '../../../../selectors/patrols';
import { TAB_KEYS } from '../../../../constants';
import { togglePatrolTrackState } from '../../../../ducks/patrols';
import { TRACKS_API_URL } from '../../../../ducks/tracks';
import useJumpToLocation from '../../../../hooks/useJumpToLocation';

import KebabMenu from '../../../../KebabMenu';
import Link from '../../../../Link';
import SvgIcon from '../../../../SvgIcon';

import * as styles from './styles.module.scss';

const TITLE_INPUT_WIDTH_CARET_BUFFER = 2;

const Header = ({ patrol, printableContentRef }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.header' });

  const jumpToLocation = useJumpToLocation();

  const lastSegment = patrol.patrol_segments[patrol.patrol_segments.length - 1] ?? null;
  const lastSegmentLeader = lastSegment?.leader ?? null;
  const displayTitle = displayTitleForPatrol(patrol, lastSegmentLeader);

  const lastSegmentLeaderSubject = useSelector(
    (state) => lastSegmentLeader?.id ? state.data.subjectStore[lastSegmentLeader.id] : null
  );
  const patrolTrackData = useSelector((state) => selectPatrolTrackData(state, patrol));
  const patrolTrackState = useSelector((state) => state.view.patrolTrackState);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const titleInputRef = useRef();
  const titleMeasureRef = useRef();

  const [title, setTitle] = useState(displayTitle);
  const [titleInputWidth, setTitleInputWidth] = useState(null);

  const patrolIconId = lastSegment ? iconIdForPatrolSegment(patrolTypes, lastSegment) : null;

  const isPatrolTrackPinned = patrolTrackState.pinned.includes(patrol.id);
  const isPatrolTrackVisible = !isPatrolTrackPinned && patrolTrackState.visible.includes(patrol.id);

  const trackToggleState = isPatrolTrackPinned ? 'pinned' : isPatrolTrackVisible ? 'visible' : 'hidden';

  // TODO: The patrol track toggle only shows the leg leader's track. Once team members and
  // assets are available from the endpoint, it should also include their tracks bounded to
  // the leg's time range.
  const hasTrack = !!lastSegmentLeader && patrolHasGeoDataToDisplay(
    patrolTrackData.trackData,
    patrolTrackData.startStopGeometries
  );

  const leaderCoordinates = lastSegmentLeaderSubject?.last_position?.geometry?.coordinates
    ?? lastSegmentLeader?.last_position?.geometry?.coordinates
    ?? null;

  // TODO: Zoom to patrol bounds only accounts for the leg leader's track/position. Once team
  // members and assets are available from the endpoint, their tracks bounded to the leg's
  // time range should also be included in the bounds.
  const patrolBounds = useMemo(() => getBoundsForPatrol(patrol, patrolTrackData), [patrol, patrolTrackData]);

  const patrolState = calcPatrolState(patrol);

  const onPrint = useReactToPrint({
    contentRef: printableContentRef,
    documentTitle: `${patrol.serial_number ?? ''} ${title}`.trim(),
    pageStyle: basePrintingStyles,
  });

  const onDownloadTrackClick = async () => {
    if (lastSegmentLeader) {
      const params = {};
      if (lastSegment?.time_range?.start_time) {
        params.since = lastSegment.time_range.start_time;
      }
      if (lastSegment?.time_range?.end_time) {
        params.until = lastSegment.time_range.end_time;
      }

      const sanitizedLeaderName = lastSegmentLeader.name.replace(/[/\\:*?"<>|]/g, '_').trim();
      try {
        await downloadFileFromUrl(
          TRACKS_API_URL(lastSegmentLeader.id),
          { filename: `Patrol_${patrol.serial_number}_${sanitizedLeaderName}.geojson`, params }
        );
      } catch (error) {
        console.error('Failed to download patrol track', error);
      }
    }
  };

  const onEditTitleButtonClick = () => {
    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  };

  useLayoutEffect(() => {
    if (titleMeasureRef.current) {
      setTitleInputWidth(titleMeasureRef.current.offsetWidth + TITLE_INPUT_WIDTH_CARET_BUFFER);
    }
  }, [title]);

  return <header className={styles.header}>
    <div className={styles.topBar}>
      <nav aria-label={t('breadcrumbNavLabel')} className={styles.breadcrumbs}>
        <ol>
          <li>
            <Link to={`/${TAB_KEYS.PATROLS}`}>{t('breadcrumbPatrolsLabel')}</Link>

            <ChevronRightIcon aria-hidden="true" />
          </li>

          <li>
            <span aria-current="page" className={styles.currentBreadcrumb} title={title}>{title}</span>
          </li>
        </ol>
      </nav>

      <div className={`${styles.topActions} ${styles.hideOnPrint}`}>
        <div className={styles.desktopActions}>
          <button
            aria-label={t(`toggleTrackButtonLabel.${trackToggleState}`)}
            aria-pressed={isPatrolTrackPinned ? 'true' : isPatrolTrackVisible ? 'mixed' : 'false'}
            className={`${styles.iconButton} ${styles.toggleTrackButton} ${
              isPatrolTrackPinned ? styles.pinned : isPatrolTrackVisible ? styles.visible : ''
            }`}
            disabled={!hasTrack}
            onClick={() => dispatch(togglePatrolTrackState(patrol.id))}
            title={t(`toggleTrackButtonLabel.${trackToggleState}`)}
            type="button"
          >
            <TrackIcon aria-hidden="true" />
          </button>

          <button
            aria-label={t('jumpToLocationButtonLabel')}
            className={styles.iconButton}
            disabled={!leaderCoordinates}
            onClick={() => leaderCoordinates && jumpToLocation(leaderCoordinates)}
            title={t('jumpToLocationButtonLabel')}
            type="button"
          >
            <MarkerFeedIcon aria-hidden="true" />
          </button>

          <button
            aria-label={t('fitToBoundsButtonLabel')}
            className={styles.iconButton}
            disabled={!patrolBounds}
            onClick={() => patrolBounds && jumpToLocation(
              [[patrolBounds[0], patrolBounds[1]], [patrolBounds[2], patrolBounds[3]]],
              undefined,
              { maxZoom: 17 }
            )}
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
            onClick={() => dispatch(togglePatrolTrackState(patrol.id))}
          >
            {t(`toggleTrackButtonLabel.${trackToggleState}`)}
          </KebabMenu.Option>

          <KebabMenu.Option
            className={styles.mobileOnlyOption}
            disabled={!leaderCoordinates}
            onClick={() => leaderCoordinates && jumpToLocation(leaderCoordinates)}
          >
            {t('jumpToLocationButtonLabel')}
          </KebabMenu.Option>

          <KebabMenu.Option
            className={styles.mobileOnlyOption}
            disabled={!patrolBounds}
            onClick={() => patrolBounds && jumpToLocation(
              [[patrolBounds[0], patrolBounds[1]], [patrolBounds[2], patrolBounds[3]]],
              undefined,
              { maxZoom: 17 }
            )}
          >
            {t('fitToBoundsButtonLabel')}
          </KebabMenu.Option>

          <KebabMenu.Divider className={styles.mobileOnlyOption} />

          <KebabMenu.Option onClick={onPrint}>{t('printOption')}</KebabMenu.Option>

          <KebabMenu.Option disabled={!hasTrack} onClick={onDownloadTrackClick}>
            {t('downloadTrackOption')}
          </KebabMenu.Option>
        </KebabMenu>

        <Link
          aria-label={t('closeButtonLabel')}
          className={styles.closeButton}
          title={t('closeButtonLabel')}
          to="/"
        >
          <CrossIcon aria-hidden="true" className={styles.closeButtonIcon} />
        </Link>
      </div>
    </div>

    <div className={styles.header}>
      <div className={styles.headerMain}>
        <div className={styles.icon}>
          <SvgIcon iconId={patrolIconId} type="patrols" />
        </div>

        <p className={styles.serialNumber}>{patrol.serial_number}</p>

        <div className={styles.titleWrapper}>
          <input
            aria-label={t('titleInputLabel')}
            className={styles.title}
            data-testid="patrolOverview-title"
            onChange={(event) => setTitle(event.target.value)}
            ref={titleInputRef}
            style={titleInputWidth ? { width: titleInputWidth } : undefined}
            type="text"
            value={title}
          />

          <span aria-hidden="true" className={styles.titleMeasure} ref={titleMeasureRef}>{title}</span>

          {/* Mouse-only. The input is already focusable/editable. */}
          <button
            aria-hidden="true"
            className={`${styles.editButton} ${styles.hideOnPrint}`}
            onClick={onEditTitleButtonClick}
            onMouseDown={(event) => event.preventDefault()}
            tabIndex={-1}
            title={t('editTitleButtonLabel')}
            type="button"
          >
            <PencilIcon aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* TODO: Show a "Mobile" provenance pill before the status pill when the patrol was
        created from a mobile device. Not implemented yet - the API doesn't return that info. */}
      <span className={`${styles.statusPill} ${styles[patrolState.key] ?? styles.cancelled}`}>
        {t(`uiStateTitles.${patrolState.key}`)}
      </span>
    </div>
  </header>;
};

export default Header;
