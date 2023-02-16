import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { calcPatrolState } from '../utils/patrols';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { PATROL_LIST_ITEM_CATEGORY, trackEventFactory } from '../utils/analytics';
import usePatrol from '../hooks/usePatrol';

import DasIcon from '../DasIcon';
import FeedListItem from '../FeedListItem';
import PatrolDistanceCovered from '../Patrols/DistanceCovered';
import PatrolMenu from '../PatrolMenu';
import PatrolTrackControls from '../PatrolTrackControls';

import styles from './styles.module.scss';

const patrolListItemTracker = trackEventFactory(PATROL_LIST_ITEM_CATEGORY);

const STATE_CHANGE_POLLING_INTERVAL = 3000;
const TRACK_FETCH_DEBOUNCE_DELAY = 150;

const PatrolListItem = ({
  className,
  dispatch: _dispatch,
  onClick,
  onSelfManagedStateChange,
  patrol: patrolFromProps,
  showControls,
  showStateTitle,
  showTitleDetails,
  ...rest
}, ref) => {
  const {
    patrolData,

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

    setPatrolState,

    onPatrolChange,
    restorePatrol,
    startPatrol,
  } = usePatrol(patrolFromProps);

  const { patrol, leader } = patrolData;

  const debouncedTrackFetch = useRef(null);
  const intervalRef = useRef(null);
  const menuRef = useRef(null);

  const isPatrolActiveOrDone = isPatrolActive || isPatrolDone;

  const { base: themeColor, background: themeBgColor } = theme;

  const handleClick = useCallback(() => {
    patrolListItemTracker.track('Click patrol list item');

    onClick?.(patrol);
  }, [onClick, patrol]);

  const patrolsData = useMemo(() => [patrolData], [patrolData]);
  const TitleDetailsComponent = useMemo(() => {
    if (isPatrolActiveOrDone) {
      return <span className={styles.titleDetails}>
        <span>{patrolElapsedTime}</span> |
        <span>
          <PatrolDistanceCovered patrolsData={patrolsData} suffix=' km' />
        </span>
      </span>;
    }

    if (isPatrolScheduled || isPatrolCancelled) {
      return <span className={styles.titleDetails}>
        Scheduled: <span>{scheduledStartTime}</span>
      </span>;
    }

    return null;
  }, [isPatrolActiveOrDone, isPatrolScheduled, isPatrolCancelled, patrolElapsedTime, patrolsData, scheduledStartTime]);

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
        >
        Restore
      </Button>;
    }

    if (isPatrolScheduled) {
      return <Button
          data-testid={`patrol-list-item-start-btn-${patrol.id}`}
          onClick={startPatrolAndTrack}
          size="sm"
          variant="light"
        >
        Start
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

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      const currentState = calcPatrolState(patrol);
      if (currentState !== patrolState) {
        setPatrolState(currentState);
        onSelfManagedStateChange && onSelfManagedStateChange(patrol);
      }
    }, STATE_CHANGE_POLLING_INTERVAL);

    return () => window.clearInterval(intervalRef.current);
  }, [onSelfManagedStateChange, patrol, patrolState, setPatrolState]);

  const renderedControlsComponent = showControls
    ? <div className={styles.controls} onClick={(event) => event.stopPropagation()}>
      <StateDependentControls />
      <PatrolMenu
        data-testid={`patrol-list-item-kebab-menu-${patrol.id}`}
        menuRef={menuRef}
        onPatrolChange={onPatrolChange}
        patrol={patrol}
      />
    </div>
    : null;

  const renderedDateComponent = <div
      className={styles.statusInfo}
      data-testid={`patrol-list-item-date-status-${patrol.id}`}
    >
    {showStateTitle && <strong data-testid={`patrol-list-item-state-title-${patrol.id}`}>{patrolState.title}</strong>}
    <span>{dateComponentDateString}</span>
  </div>;

  const renderedIconComponent = patrolIconId && <button
      className={styles.icon}
      data-testid={`patrol-list-item-icon-${patrol.id}`}
      type="button"
    >
    <DasIcon iconId={patrolIconId} style={{ fill: theme.fontColor ? theme.fontColor : 'auto' }} type="events" />
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

const PatrolListItemForwardRef = forwardRef(PatrolListItem);

PatrolListItemForwardRef.defaultProps = {
  onClick: null,
  showControls: true,
  showStateTitle: true,
  showTitleDetails: true,
};

PatrolListItemForwardRef.propTypes = {
  onClick: PropTypes.func,
  showControls: PropTypes.bool,
  showStateTitle: PropTypes.bool,
  showTitleDetails: PropTypes.bool,
};

export default memo(PatrolListItemForwardRef);
