import React from 'react';
import { SpinLoader } from 'react-css-loaders';

import styles from './styles.module.scss';

export default () => <div className={styles.background}>
  <SpinLoader className={styles.spinner} />
</div>