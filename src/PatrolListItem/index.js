import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import Button from 'react-bootstrap/Button';

import { fetchTracksIfNecessary } from '../utils/tracks';
import { PATROL_LIST_ITEM_CATEGORY, trackEventFactory } from '../utils/analytics';
import usePatrol from '../hooks/usePatrol';

import SvgIcon from '../SvgIcon';
import FeedListItem from '../FeedListItem';
import PatrolDistanceCovered from '../Patrols/DistanceCovered';
import PatrolMenu from '../PatrolMenu';
import PatrolTrackControls from '../PatrolTrackControls';

import * as styles from './styles.module.scss';
import { useTranslation } from 'react-i18next';

const patrolListItemTracker = trackEventFactory(PATROL_LIST_ITEM_CATEGORY);

const TRACK_FETCH_DEBOUNCE_DELAY = 150;

const PatrolListItem = ({
  className,
  dispatch: _dispatch,
  onClick = null,
  patrol,
  ref,
  showControls = true,
  showStateTitle = true,
  showTitleDetails = true,
  ...rest
}) => {
  const {
    patrolTrackData,

    isPatrolActive,
    isPatrolCancelled,
    isPatrolDone,
    isPatrolScheduled,

    actualEndTime,
    actualStartTime,
    displayTitle,
    patrolElapsedTime,
    patrolIconId,
    patrolState,
    scheduledStartTime,
    theme,

    dateComponentDateString,


    onPatrolChange,
    restorePatrol,
    startPatrol,
  } = usePatrol(patrol);

  const { leader } = patrolTrackData;

  const debouncedTrackFetch = useRef(null);
  const { t } = useTranslation('patrols');
  const isPatrolActiveOrDone = isPatrolActive || isPatrolDone;

  const { base: themeColor, background: themeBgColor } = theme;

  const handleClick = useCallback(() => {
    patrolListItemTracker.track('Click patrol list item');

    onClick?.(patrol);
  }, [onClick, patrol]);

  const patrolsData = useMemo(() => [{ patrol, ...patrolTrackData }], [patrol, patrolTrackData]);
  const TitleDetailsComponent = useMemo(() => {
    if (isPatrolActiveOrDone) {
      return <span className={styles.titleDetails}>
        <span>{patrolElapsedTime}</span> | <span>
          <PatrolDistanceCovered patrolsData={patrolsData} />
        </span>
      </span>;
    }

    if (isPatrolScheduled || isPatrolCancelled) {
      return <span className={styles.titleDetails}>
        {t('patrolListItem.scheduledTitle')}<span>{scheduledStartTime}</span>
      </span>;
    }

    return null;
  }, [isPatrolActiveOrDone, isPatrolScheduled, isPatrolCancelled, patrolElapsedTime, patrolsData, scheduledStartTime, t]);

  const onLocationClick = useCallback(() => {
    patrolListItemTracker.track('Click "jump to location" from patrol list item');
  }, []);

  const restorePatrolAndTrack = useCallback(() => {
    patrolListItemTracker.track('Restore patrol from patrol list item');

    restorePatrol();
  }, [restorePatrol]);

  const startPatrolAndTrack = useCallback(() => {
    patrolListItemTracker.track('Start patrol from patrol list item');

    startPatrol();
  }, [startPatrol]);

  const StateDependentControls = () => {
    if (isPatrolActiveOrDone) {
      return <PatrolTrackControls patrol={patrol} onLocationClick={onLocationClick} />;
    }

    if (isPatrolCancelled) {
      return <Button
          data-testid={`patrol-list-item-restore-btn-${patrol.id}`}
          onClick={restorePatrolAndTrack}
          size="sm"
          variant="light"
          className={styles.stateDependantControl}
        >
        {t('patrolListItem.restoreButton')}
      </Button>;
    }

    if (isPatrolScheduled) {
      return <Button
          data-testid={`patrol-list-item-start-btn-${patrol.id}`}
          onClick={startPatrolAndTrack}
          size="sm"
          variant="light"
          className={styles.stateDependantControl}
        >
        {t('patrolListItem.startButton')}
      </Button>;
    }

    return null;
  };

  useEffect(() => {
    if (leader?.id) {
      window.clearTimeout(debouncedTrackFetch.current);
      debouncedTrackFetch.current = setTimeout(() => {
        fetchTracksIfNecessary([leader.id], {
          optionalDateBoundaries: { since: actualStartTime, until: actualEndTime }
        });
      }, TRACK_FETCH_DEBOUNCE_DELAY);

      return () => window.clearTimeout(debouncedTrackFetch.current);
    }
  }, [actualEndTime, actualStartTime, leader]);

  const renderedControlsComponent = showControls
    ? <div className={styles.controls}>
      <StateDependentControls />
      <PatrolMenu
        data-testid={`patrol-list-item-kebab-menu-${patrol.id}`}
        onPatrolChange={onPatrolChange}
        patrol={patrol}
        showPatrolPrintOption={false}
        className={styles.patrolMenu}
        isPatrolCancelled={isPatrolCancelled}
      />
    </div>
    : null;

  const renderedDateComponent = <div
      className={styles.statusInfo}
      data-testid={`patrol-list-item-date-status-${patrol.id}`}
    >
    {showStateTitle && <strong data-testid={`patrol-list-item-state-title-${patrol.id}`}>
      {t(`detailView.header.uiStateTitles.${patrolState.key}`)}
    </strong>
    }
    <span>{dateComponentDateString}</span>
  </div>;

  const renderedIconComponent = patrolIconId && <button
      className={styles.icon}
      data-testid={`patrol-list-item-icon-${patrol.id}`}
      title={displayTitle}
      type="button"
    >
    <SvgIcon iconId={patrolIconId} style={{ fill: theme.fontColor ? theme.fontColor : 'white' }} type="patrols" />
  </button>;

  const renderedTitleComponent = <>
    <span className={styles.serialNumber}>{patrol.serial_number}</span>
    <button
        className={styles.title}
        data-testid={`patrol-list-item-title-${patrol.id}`}
        title={displayTitle}
        type='button'
      >
      <span className={styles.mainTitle}>{displayTitle}</span>
      {showTitleDetails && TitleDetailsComponent}
    </button>
  </>;

  return <FeedListItem
    className={`${styles.item} ${className}`}
    ControlsComponent={renderedControlsComponent}
    DateComponent={renderedDateComponent}
    IconComponent={renderedIconComponent}
    onClick={handleClick}
    ref={ref}
    themeBgColor={themeBgColor}
    themeColor={themeColor}
    title={displayTitle}
    TitleComponent={renderedTitleComponent}
    {...rest}
  />;
};

export default memo(PatrolListItem);
