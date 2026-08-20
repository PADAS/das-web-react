import React, { memo, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ChevronRightIcon } from '../../../../common/images/icons/chevron-right.svg';
import { ReactComponent as ClipIcon } from '../../../../common/images/icons/link.svg';
import { ReactComponent as CrossIcon } from '../../../../common/images/icons/cross.svg';
import { ReactComponent as DownloadArrowIcon } from '../../../../common/images/icons/download-arrow.svg';
import { ReactComponent as FitScreenIcon } from '../../../../common/images/icons/fit-screen.svg';
import { ReactComponent as MarkerFeedIcon } from '../../../../common/images/icons/marker-feed.svg';
import { ReactComponent as PencilIcon } from '../../../../common/images/icons/pencil.svg';
import { ReactComponent as PrinterIcon } from '../../../../common/images/icons/printer-outline.svg';
import { ReactComponent as TrackIcon } from '../../../../common/images/icons/tracks_off.svg';

import { basePrintingStyles } from '../../../../utils/styles';
import {
  calcPatrolState,
  getBoundsForPatrol,
  getIsMobilePatrol,
  getPatrolLocationCoordinates,
  iconIdForPatrolSegment,
  patrolHasTrackData,
} from '../../../../utils/patrols';
import { DAS_HOST, TAB_KEYS } from '../../../../constants';
import { downloadJsonAsFile } from '../../../../utils/download';
import { TrackerContext } from '../../../../utils/analytics';
import { selectPatrolTrackData } from '../../../../selectors/patrols';
import { togglePatrolTrackState } from '../../../../ducks/patrols';
import useJumpToLocation from '../../../../hooks/useJumpToLocation';

import KebabMenu from '../../../../KebabMenu';
import Link from '../../../../Link';
import SvgIcon from '../../../../SvgIcon';

import * as styles from './styles.module.scss';

const COPY_LINK_TOAST_AUTOCLOSE = 2000;
const TITLE_INPUT_WIDTH_CARET_BUFFER = 2;

const Header = ({ onChangeTitle, patrol, printableContentRef, title }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.header' });

  const tracker = useContext(TrackerContext);

  const jumpToLocation = useJumpToLocation();

  const lastSegment = patrol.patrol_segments[patrol.patrol_segments.length - 1] ?? null;

  const patrolTrackData = useSelector((state) => selectPatrolTrackData(state, patrol));
  const patrolTrackState = useSelector((state) => state.view.patrolTrackState);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const titleInputRef = useRef();
  const titleMeasureRef = useRef();

  const [titleInputWidth, setTitleInputWidth] = useState(null);

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

  const patrolState = calcPatrolState(patrol);

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

  const onEditTitleButton = () => {
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
            onChange={(event) => onChangeTitle(event.target.value)}
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
            onClick={onEditTitleButton}
            onMouseDown={(event) => event.preventDefault()}
            tabIndex={-1}
            title={t('editTitleButtonLabel')}
            type="button"
          >
            <PencilIcon aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={styles.pills}>
        {getIsMobilePatrol(patrol) && <span className={styles.provenancePill}>{t('mobileProvenancePill')}</span>}

        <span className={`${styles.statusPill} ${styles[patrolState.key] ?? styles.cancelled}`}>
          {t(`uiStateTitles.${patrolState.key}`)}
        </span>
      </div>
    </div>
  </header>;
};

export default memo(Header);
