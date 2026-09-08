import React, { memo, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

import { ReactComponent as DownloadArrowIcon } from '../common/images/icons/download-arrow.svg';
import { ReactComponent as PrinterIcon } from '../common/images/icons/printer-outline.svg';
import { ReactComponent as ClipIcon } from '../common/images/icons/link.svg';
import { ReactComponent as PlayIcon } from '../common/images/icons/play-circle.svg';
import { ReactComponent as StopIcon } from '../common/images/icons/stop.svg';
import { ReactComponent as CloseIcon } from '../common/images/icons/close-icon.svg';
import { ReactComponent as RestoreIcon } from '../common/images/icons/restore.svg';

import { basePrintingStyles } from '../utils/styles';
import {
  buildPatrolEndUpdate,
  buildPatrolReopenUpdate,
  buildPatrolStartUpdate,
  calcPatrolState,
  canEndPatrol,
} from '../utils/patrols';
import { DAS_HOST, PATROL_API_STATES, PATROL_UI_STATES } from '../constants';
import { downloadFileFromUrl } from '../utils/download';
import { PATROL_LIST_ITEM_CATEGORY, trackEventFactory } from '../utils/analytics';
import { TRACKS_API_URL } from '../ducks/tracks';
import { usePatrolsPermissions } from '../hooks/usePermissions';

import TextCopyBtn from '../TextCopyBtn';
import KebabMenu from '../KebabMenu';

import * as styles from './styles.module.scss';

const patrolListItemTracker = trackEventFactory(PATROL_LIST_ITEM_CATEGORY);

const PatrolMenu = ({
  patrol,
  onPatrolChange,
  printableContentRef,
  patrolTitle = '',
  isPatrolCancelled = false,
  showPatrolPrintOption = true,
  className = '',
  ...rest
}) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolMenu' });

  const patrolState = calcPatrolState(patrol);

  const { hasPatrolsUpdatePermission } = usePatrolsPermissions();
  const patrolLeader = patrol.patrol_segments[0]?.leader;
  const patrolTimeRange = patrol.patrol_segments[0]?.time_range;

  const patrolLeaderTrackTimes = useSelector((state) =>
    state.data.tracks[patrolLeader?.id]?.track?.features?.[0]?.properties?.coordinateProperties?.times
  );

  const doesPatrolLeaderHaveTracksWithinPatrolTimeRange = useMemo(() => {
    if (!patrolLeaderTrackTimes?.length) return false;

    const patrolStartTimestamp = patrolTimeRange?.start_time
      ? new Date(patrolTimeRange.start_time).getTime()
      : null;
    const patrolEndTimestamp = patrolTimeRange?.end_time
      ? new Date(patrolTimeRange.end_time).getTime()
      : null;

    if (!patrolStartTimestamp && !patrolEndTimestamp) return true;

    // Track times are sorted newest-first; check range overlap using only the first/last entries
    const trackNewest = new Date(patrolLeaderTrackTimes[0]).getTime();
    const trackOldest = new Date(patrolLeaderTrackTimes[patrolLeaderTrackTimes.length - 1]).getTime();

    return (!patrolStartTimestamp || trackNewest >= patrolStartTimestamp)
      && (!patrolEndTimestamp || trackOldest <= patrolEndTimestamp);
  }, [patrolLeaderTrackTimes, patrolTimeRange]);

  const patrolIsDone = useMemo(() => {
    return patrolState === PATROL_UI_STATES.DONE;
  }, [patrolState]);

  const patrolIsCancelled = useMemo(() =>
    patrolState === PATROL_UI_STATES.CANCELLED
  , [patrolState]);

  const canEnd = useMemo(() => canEndPatrol(patrol), [patrol]);

  const canRestorePatrol = useMemo(() => {
    return patrolState === PATROL_UI_STATES.DONE
    || patrolState === PATROL_UI_STATES.CANCELLED;
  }, [patrolState]);

  const canCancelPatrol = useMemo(() => {
    return !(patrolState === PATROL_UI_STATES.DONE
      || patrolState === PATROL_UI_STATES.CANCELLED);
  }, [patrolState]);

  const patrolStartEndCanBeToggled = useMemo(() => {
    return (patrolState === PATROL_UI_STATES.ACTIVE
      || patrolState === PATROL_UI_STATES.READY_TO_START
      || patrolState === PATROL_UI_STATES.SCHEDULED
      || patrolState === PATROL_UI_STATES.START_OVERDUE);
  }, [patrolState]);

  const patrolCancelRestoreCanBeToggled = useMemo(() => {
    return canRestorePatrol || canCancelPatrol;
  }, [canCancelPatrol, canRestorePatrol]);

  const patrolStartStopTitle = useMemo(() => {
    if (canEnd || patrolIsCancelled || patrolIsDone) return t('endPatrol');
    return t('startPatrol');
  }, [canEnd, patrolIsCancelled, patrolIsDone, t]);

  const patrolCancelRestoreTitle = useMemo(() => {
    if (canRestorePatrol) return t('restorePatrol');
    return t('cancelPatrol');
  }, [canRestorePatrol, t]);

  const togglePatrolCancellationState = useCallback(() => {
    patrolListItemTracker.track(`${canRestorePatrol ? 'Restore' : 'Cancel'} patrol from patrol list item kebab menu`);

    if (canRestorePatrol) {
      onPatrolChange(buildPatrolReopenUpdate(patrol));
    } else {
      onPatrolChange({ state: PATROL_API_STATES.CANCELLED });
    }
  }, [canRestorePatrol, onPatrolChange, patrol]);

  const togglePatrolStartStopState = useCallback(() => {
    patrolListItemTracker.track(`${patrolStartStopTitle} from patrol list item kebab menu`);

    if (canEnd) {
      onPatrolChange(buildPatrolEndUpdate(patrol));
    } else {
      onPatrolChange(buildPatrolStartUpdate(patrol));
    }
  }, [canEnd, onPatrolChange, patrol, patrolStartStopTitle]);

  const handleDownloadTrack = useCallback(() => {
    if (!patrolLeader) return;

    patrolListItemTracker.track('Download patrol track from patrol list item kebab menu');

    const params = {};
    if (patrolTimeRange?.start_time) params.since = patrolTimeRange.start_time;
    if (patrolTimeRange?.end_time) params.until = patrolTimeRange.end_time;

    const sanitizedLeaderName = patrolLeader.name.replace(/[/\\:*?"<>|]/g, '_').trim();
    void downloadFileFromUrl(TRACKS_API_URL(patrolLeader.id), { params, filename: `Patrol_${patrol.serial_number}_${sanitizedLeaderName}.geojson` })
      .catch((error) => {
        console.error('Failed to download patrol track', error);
      });
  }, [patrol.serial_number, patrolLeader, patrolTimeRange]);

  const isDownloadDisabled = !patrolLeader || !doesPatrolLeaderHaveTracksWithinPatrolTimeRange;

  const handlePrint = useReactToPrint({
    contentRef: printableContentRef,
    documentTitle: `${patrol.serial_number} ${patrolTitle} `,
    pageStyle: basePrintingStyles,
  });

  return <KebabMenu
      aria-label={t('label')}
      align='end'
      className={className}
      title={t('title')}
      {...rest}
    >
    { (hasPatrolsUpdatePermission && !isPatrolCancelled && !patrolIsDone) &&
      <KebabMenu.Option disabled={!patrolStartEndCanBeToggled} onClick={togglePatrolStartStopState}>
        { canEnd ? <StopIcon /> : <PlayIcon data-testid="play-icon" /> }
        {patrolStartStopTitle}
      </KebabMenu.Option>
    }

    { hasPatrolsUpdatePermission &&
      <KebabMenu.Option disabled={!patrolCancelRestoreCanBeToggled} onClick={togglePatrolCancellationState}>
        { isPatrolCancelled || patrolIsDone ? <RestoreIcon /> : <CloseIcon data-testid="close-icon" /> }
        {patrolCancelRestoreTitle}
      </KebabMenu.Option>
    }

    { !!patrol.id &&
      <KebabMenu.Option as="div" className={styles.copyBtn}>
        <TextCopyBtn
          label={t('copyButton')}
          text={`${DAS_HOST}/patrols/${patrol.id}`}
          icon={<ClipIcon data-testid="clip-icon" />}
          successMessage={t('copyButtonMessage')}
          permitPropagation />
      </KebabMenu.Option>
    }

    { showPatrolPrintOption &&
      <KebabMenu.Option onClick={handlePrint}>
        <PrinterIcon data-testid="printer-icon" />
        {t('printPatrolButton')}
      </KebabMenu.Option>
    }

    {isDownloadDisabled
      ? <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`download-track-tooltip-${patrol.id}`}>{t('noTrackDataTooltip')}</Tooltip>}
        >
        <span>
          <KebabMenu.Option disabled onClick={handleDownloadTrack}>
            <DownloadArrowIcon data-testid="download-arrow-icon" />
            {t('downloadTrackButton')}
          </KebabMenu.Option>
        </span>
      </OverlayTrigger>
      : <KebabMenu.Option onClick={handleDownloadTrack}>
        <DownloadArrowIcon data-testid="download-arrow-icon" />
        {t('downloadTrackButton')}
      </KebabMenu.Option>
    }
  </KebabMenu>;
};

export default memo(PatrolMenu);
