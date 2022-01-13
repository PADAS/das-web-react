import React from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as PlayIcon } from '../../common/images/icons/play.svg';

import DasIcon from '../../DasIcon';

import styles from './styles.module.scss';

const Header = ({ iconId, serialNumber, setTitle, title }) => <div className={styles.header}>
  <div className={styles.icon}>
    <DasIcon type='events' iconId={iconId} />
  </div>

  <p className={styles.serialNumber}>{serialNumber}</p>

  <input
    className={styles.titleInput}
    onChange={(event) => setTitle(event.target.value)}
    type="text"
    value={title}
  />

  <Button
    className={styles.startPatrolButton}
    onClick={() => {}}
    type="button"
    variant="secondary"
  >
    <PlayIcon />
    Start Patrol
  </Button>
</div>;

Header.propTypes = { title: PropTypes.string.isRequired };

export default Header;
