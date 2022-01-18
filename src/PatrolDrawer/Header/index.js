import React, { useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as PlayIcon } from '../../common/images/icons/play.svg';

import usePatrol from '../../hooks/usePatrol';

import DasIcon from '../../DasIcon';
import PatrolDistanceCovered from '../../Patrols/DistanceCovered';
import PatrolMenu from '../../PatrolMenu';

import styles from './styles.module.scss';

const Header = ({ patrol, restorePatrol, setTitle, startPatrol, title }) => {
  const {
    patrolData,

    isPatrolActive,
    isPatrolCancelled,
    isPatrolDone,
    isPatrolScheduled,

    patrolElapsedTime,
    patrolIconId,
    patrolState,
    scheduledStartTime,
    theme,

    dateComponentDateString,
  } = usePatrol(patrol);

  const titleDetails = useMemo(() => {
    if (isPatrolActive || isPatrolDone) {
      return <span>
        {patrolElapsedTime} | <PatrolDistanceCovered patrolsData={[patrolData]} suffix=' km' />
      </span>;
    }
    if (isPatrolScheduled || isPatrolCancelled) {
      return <span>Scheduled {scheduledStartTime}</span>;
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

  const isNewPatrol = !patrol.id;

  return <div className={styles.header} style={{ backgroundColor: !isNewPatrol ? theme.background : undefined }}>
    <div className={styles.icon} style={{ backgroundColor: !isNewPatrol ? theme.base : undefined }}>
      <DasIcon className={!isNewPatrol ? '' : 'new'} type='events' iconId={patrolIconId}  />
    </div>

    <p className={styles.serialNumber}>{patrol.serial_number}</p>

    <div className={styles.title}>
      <input onChange={(event) => setTitle(event.target.value)} type="text" value={title} />

      {!isNewPatrol && titleDetails}
    </div>

    {!isNewPatrol && <div className={styles.description}>
      <span style={{ color: theme.base }}>{patrolState.title}</span>
      <br />
      <span className={styles.date}>{dateComponentDateString}</span>
    </div>}

    {!isPatrolDone && !isPatrolCancelled && <Button
      className={`${styles.startPatrolButton} ${isNewPatrol ? 'newPatrol' : ''}`}
      onClick={startPatrol}
      type="button"
      variant="secondary"
    >
      <PlayIcon />
      Start Patrol
    </Button>}

    {isPatrolCancelled && <Button
      className={styles.restorePatrolButton}
      onClick={restorePatrol}
      type="button"
      variant="secondary"
    >
      Restore
    </Button>}

    {/* TODO: Add onPatrolChange */}
    {!isNewPatrol && <PatrolMenu patrol={patrol} onPatrolChange={() => {}} />}
  </div>;
};

Header.propTypes = {
  patrol: PropTypes.object.isRequired,
  restorePatrol: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
  startPatrol: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default Header;
