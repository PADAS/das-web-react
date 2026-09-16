import React, { useId } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';

import * as styles from './styles.module.scss';

const DEFAULT_LOADER_SIZE = 50;

const LoadingOverlay = ({
  children = null,
  className = '',
  loaderSize = DEFAULT_LOADER_SIZE,
  message = '',
  style = {},
  ...otherProps
}) => {
  const messageId = useId();

  return <div
      className={`${styles.overlay} ${className}`}
      style={style}
      {...otherProps}
    >
    <MoonLoader color="white" size={loaderSize} />

    {message && <span className={styles.message} id={messageId}>{message}</span>}

    {typeof children === 'function' ? children({ messageId }) : children}
  </div>;
};

export default LoadingOverlay;
