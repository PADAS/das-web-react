import React from 'react';
import PropTypes from 'prop-types';
import { SpinLoader } from 'react-css-loaders';

import styles from './styles.module.scss';

const LoadingOverlay = props => {
  const { style = {}, className = '', message = '', ...rest } = props;

  return <div style={style} className={`${styles.background}${` ${className}` || ''}`} {...rest}>
    <SpinLoader className={styles.spinner} />
    {message && <span>{message}</span>}
  </div>;
};

export default LoadingOverlay;

LoadingOverlay.propTypes = {
  message: PropTypes.string,
};