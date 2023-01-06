import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';

import { calcPatrolState } from '../utils/patrols';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { trackEventFactory, PATROL_LIST_ITEM_CATEGORY } from '../utils/analytics';
import usePatrol from '../hooks/usePatrol';

import DasIcon from '../DasIcon';
import FeedListItem from '../FeedListItem';
import PatrolTrackControls from '../PatrolTrackControls';
import PatrolDistanceCovered from '../Patrols/DistanceCovered';
import PatrolMenu from '../PatrolMenu';

import styles from './styles.module.scss';
import { togglePatrolTrackState } from '../ducks/patrols';
import { toggleTrackState } from '../ducks/map-ui';

const patrolListItemTracker = trackEventFactory(PATROL_LIST_ITEM_CATEGORY);

const TRACK_FETCH_DEBOUNCE_DELAY = 150;
const STATE_CHANGE_POLLING_INTERVAL = 3000;

const PatrolListItem = ({ patrol: patrolFromProps, showControls, onSelfManagedStateChange, onTitleClick, dispatch: _dispatch, showTitleDetails, showStateTitle, ...rest }, ref) => {
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

  const handleTitleClick = useCallback(() => {
    patrolListItemTracker.track('Click patrol list item');

    onTitleClick(patrol);
  }, [onTitleClick, patrol]);

  const TitleDetailsComponent = useMemo(() => {
    if (isPatrolActiveOrDone) {
      return <span className={styles.titleDetails}>
        <span>{patrolElapsedTime}</span> |
        <span>
          <PatrolDistanceCovered patrolsData={[patrolData]} suffix=' km' />
        </span>
      </span>;
    }
    if (isPatrolScheduled || isPatrolCancelled) {
      return <span className={styles.titleDetails}>
        Scheduled: <span>{scheduledStartTime}</span>
      </span>;
    }
    return null;
  }, [isPatrolCancelled, isPatrolActiveOrDone, isPatrolScheduled, patrolData, patrolElapsedTime, scheduledStartTime]);

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
    if (isPatrolActiveOrDone) return <PatrolTrackControls patrol={patrol} onLocationClick={onLocationClick} />;
    if (isPatrolCancelled) return <Button variant='light' size='sm' onClick={restorePatrolAndTrack} data-testid={`patrol-list-item-restore-btn-${patrol.id}`}>Restore</Button>;
    if (isPatrolScheduled) return  <Button variant='light' size='sm' onClick={startPatrolAndTrack} data-testid={`patrol-list-item-start-btn-${patrol.id}`}>Start</Button>;
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

  return <FeedListItem
    ref={ref}
    themeColor={themeColor}
    themeBgColor={themeBgColor}
    title={displayTitle}
    onClick={handleTitleClick}
    IconComponent={patrolIconId && <button onClick={handleTitleClick} data-testid={`patrol-list-item-icon-${patrol.id}`} className={styles.icon} type='button'>
      <DasIcon type='events' iconId={patrolIconId} style={{ fill: theme.fontColor ? theme.fontColor : 'auto' }} />
    </button>}
    TitleComponent={
      <>
        <span className={styles.serialNumber}>{patrol.serial_number}</span>
        <button data-testid={`patrol-list-item-title-${patrol.id}`} title={displayTitle} className={styles.title} type='button' onClick={handleTitleClick}>
          <span className={styles.mainTitle}>{displayTitle}</span>
          {showTitleDetails && TitleDetailsComponent}
        </button>
      </>
    }
    DateComponent={
      <div className={styles.statusInfo} data-testid={`patrol-list-item-date-status-${patrol.id}`}>
        { showStateTitle &&
          <strong data-testid={`patrol-list-item-state-title-${patrol.id}`}>{patrolState.title}</strong>
        }
        <span>{dateComponentDateString}</span>
      </div>
    }
    ControlsComponent={
      showControls ? <>
        <StateDependentControls />
        <PatrolMenu data-testid={`patrol-list-item-kebab-menu-${patrol.id}`} patrol={patrol} menuRef={menuRef} onPatrolChange={onPatrolChange} />
      </> : null
    }

  {...rest}
  />;
};

PatrolListItem.defaulProps = {
  showControls: true,
  showTitleDetails: true,
  showStateTitle: true
};

export default connect(null, { togglePatrolTrackState, toggleTrackState })(memo(forwardRef(PatrolListItem)));
