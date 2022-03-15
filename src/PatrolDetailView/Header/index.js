import React, { useCallback, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as PlayIcon } from '../../common/images/icons/play.svg';

import { PATROL_DETAIL_VIEW_CATEGORY, trackEventFactory } from '../../utils/analytics';
import usePatrol from '../../hooks/usePatrol';

import DasIcon from '../../DasIcon';
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
    patrolDetailViewTracker.track('Restore patrol from patrol drawer header');
    restorePatrol();
  }, [restorePatrol]);

  const startPatrolAndTrack = useCallback(() => {
    patrolDetailViewTracker.track('Start patrol from patrol drawer header');
    startPatrol();
  }, [startPatrol]);

  return <div className={styles.header} style={{ backgroundColor: !isNewPatrol ? theme.background : undefined }}>
    <div className={styles.icon} style={{ backgroundColor: !isNewPatrol ? theme.base : undefined }}>
      <DasIcon className={!isNewPatrol ? '' : 'newPatrol'} type='events' iconId={patrolIconId}  />
    </div>

    <p className={styles.serialNumber}>{patrol.serial_number}</p>

    <div className={styles.title}>
      <input onChange={(event) => setTitle(event.target.value)} type="text" value={title} />

      {!isNewPatrol && titleDetails}
    </div>

    {!isNewPatrol && <div className={styles.description} data-testid="patrol-drawer-header-description">
      <span style={{ color: theme.base }}>{patrolState.title}</span>
      <br />
      <span className={styles.date}>{dateComponentDateString}</span>
    </div>}

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
