import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';

import * as styles from './styles.module.scss';

const LOADER_SIZE = 50;

const LoadingOverlay = ({ className = '', message = '', style = {}, ...otherProps }) => <div
    className={`${styles.overlay} ${className}`}
    style={style}
    {...otherProps}
  >
  <MoonLoader color="white" size={LOADER_SIZE} />

  {message && <span className={styles.message}>{message}</span>}
</div>;

export default LoadingOverlay;
