import React from 'react';

import { ReactComponent as EarthRangerLogo } from '../common/images/earth-ranger-logo.svg';

import * as styles from './styles.module.scss';

const EarthRangerIconLoadingOverlay = ({ message }) => <div className={styles.wrapper}>
  <EarthRangerLogo className={styles.logo} />

  {!!message && <p>{message}</p>}
</div>;

export default EarthRangerIconLoadingOverlay;
