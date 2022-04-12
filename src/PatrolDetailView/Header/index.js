import React, { useCallback, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as PlayIcon } from '../../common/images/icons/play.svg';

import { PATROL_DETAIL_VIEW_CATEGORY, trackEventFactory } from '../../utils/analytics';
import usePatrol from '../../hooks/usePatrol';

import DasIcon from '../../DasIcon';
import PatrolTrackControls from '../../PatrolTrackControls';
import PatrolDistanceCovered from '../../Patrols/DistanceCovered';
import PatrolMenu from '../../PatrolMenu';

import styles from './styles.module.scss';

const patrolDetailViewTracker = trackEventFactory(PATROL_DETAIL_VIEW_CATEGORY);

const Header = ({ patrol, setTitle, title }) => {
  const {
    patrolData,

    isPatrolActive,
    isPatrolCancelled,
    isPatrolDone,
    isPatrolOverdue,
    isPatrolScheduled,

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

  const isNewPatrol = !patrol.id;

  const titleDetails = useMemo(() => {
    if (isPatrolActive || isPatrolDone) {
      return <span data-testid="patrol-drawer-header-details">
        {patrolElapsedTime} | <PatrolDistanceCovered patrolsData={[patrolData]} suffix=' km' />
      </span>;
    }
    if (isPatrolScheduled || isPatrolCancelled) {
      return <span data-testid="patrol-drawer-header-details">Scheduled {scheduledStartTime}</span>;
    }
    return null;
  }, [
    isPatrolActive,
    isPatrolDone,
    isPatrolCancelled,
    isPatrolScheduled,
    patrolData,
    patrolElapsedTime,
    scheduledStartTime,
  ]);

  const restorePatrolAndTrack = useCallback(() => {
    patrolDetailViewTracker.track('Restore patrol from patrol detail view header');
    restorePatrol();
  }, [restorePatrol]);

  const startPatrolAndTrack = useCallback(() => {
    patrolDetailViewTracker.track('Start patrol from patrol detail view header');
    startPatrol();
  }, [startPatrol]);

  const onLocationClick = useCallback(() => {
    patrolDetailViewTracker.track('Click "jump to location" from patrol detail view');
  }, []);

  return <div className={styles.header} style={{ backgroundColor: !isNewPatrol ? theme.background : undefined }}>
    <div className={styles.icon} style={{ backgroundColor: !isNewPatrol ? theme.base : undefined }}>
      <DasIcon className={!isNewPatrol ? '' : 'newPatrol'} style={{ fill: theme.font ? theme.font : 'auto' }} type='events' iconId={patrolIconId}  />
    </div>

    <p className={styles.serialNumber}>{patrol.serial_number}</p>

    <div className={styles.title}>
      <input onChange={(event) => setTitle(event.target.value)} type="text" value={title} />

      {!isNewPatrol && titleDetails}
    </div>

    {!isNewPatrol && <div className={styles.description} data-testid="patrol-drawer-header-description">
      <span style={{ color: (theme?.font ?? theme?.base) }}>{patrolState.title}</span>
      <br />
      <span className={styles.date}>{dateComponentDateString}</span>
    </div>}

    {(isPatrolActive || isPatrolDone) && <PatrolTrackControls patrol={patrol} onLocationClick={onLocationClick} className={styles.patrolTrackControls}/>}

    {(isPatrolScheduled || isPatrolOverdue) && <Button
      className={`${styles.startPatrolButton} ${isNewPatrol ? 'newPatrol' : ''}`}
      onClick={startPatrolAndTrack}
      type="button"
      variant="secondary"
    >
      <PlayIcon />
      Start Patrol
    </Button>}

    {isPatrolCancelled && <Button
      className={styles.restorePatrolButton}
      onClick={restorePatrolAndTrack}
      type="button"
      variant="secondary"
    >
      Restore
    </Button>}

    {!isNewPatrol && !isPatrolCancelled && <PatrolMenu onPatrolChange={onPatrolChange} patrol={patrol} />}
  </div>;
};

Header.propTypes = {
  patrol: PropTypes.object.isRequired,
  setTitle: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default Header;
