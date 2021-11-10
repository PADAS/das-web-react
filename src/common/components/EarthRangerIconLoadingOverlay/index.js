import React from 'react';
import { ReactComponent as EarthRangerLogo } from '../common/images/earth-ranger-logo-vertical.svg';
import styles from './styles.module.scss';

const Loader = ({ message }) => {
  return <div className={styles.wrapper}>
    <EarthRangerLogo className={styles.logo} />
    {!!message && <p>{message}</p>}
  </div>;
};

export default Loader;