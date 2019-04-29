import React from 'react';
import { SpinLoader } from 'react-css-loaders';

import styles from './styles.module.scss';

export default props => <div className={`${styles.background}${` ${props.className}` || ''}`}>
  <SpinLoader className={styles.spinner} />
</div>