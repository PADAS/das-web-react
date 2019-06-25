import React from 'react';
import PropTypes from 'prop-types';
import { SpinLoader } from 'react-css-loaders';

import styles from './styles.module.scss';

const LoadingOverlay = props => <div className={`${styles.background}${` ${props.className}` || ''}`}>
  <SpinLoader className={styles.spinner} />
  {props.message && <span>{props.message}</span>}
</div>;

export default LoadingOverlay;

LoadingOverlay.propTypes = {
  message: PropTypes.string,
};