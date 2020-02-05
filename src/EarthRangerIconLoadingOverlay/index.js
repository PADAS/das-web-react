import React from 'react';
import { ReactComponent as EarthRangerLogo } from '../common/images/earth-ranger-logo-vertical.svg';
import styles from './styles.module.scss';

const Loader = () => {
  return <div className={styles.wrapper}>
    <EarthRangerLogo className={styles.logo} />
    <p>EarthRanger is loading...</p>
  </div>;
};

export default Loader;