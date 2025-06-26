import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';

import * as styles from './styles.module.scss';

const DEFAULT_LOADER_SIZE = 50;

const LoadingOverlay = ({ className = '', message = '', style = {}, loaderSize = DEFAULT_LOADER_SIZE, ...otherProps }) => <div
    className={`${styles.overlay} ${className}`}
    style={style}
    {...otherProps}
  >
  <MoonLoader color="white" size={loaderSize} />

  {message && <span className={styles.message}>{message}</span>}
</div>;

export default LoadingOverlay;
