import React, { memo } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const IconButton = memo((props) => {
  const { type, className, ...rest } = props;

  return <button className={`${styles.button} ${styles[type]} ${className || ''}`}></button>

});


IconButton.propTypes = {
  type: PropTypes.string.isRequired,
  className: PropTypes.string,
};