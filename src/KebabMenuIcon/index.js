import React, { forwardRef, memo } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

// eslint-disable-next-line react/display-name
const KebabMenuIcon = forwardRef(({ isOpen, className, ...rest }, ref) => <button
    ref={ref}
    className={`${styles.kebab}${className ? ` ${className}` : ''}${isOpen ? ` ${styles.open}` : ''}`}
    {...rest}
  >
  <span></span>
</button>
);

KebabMenuIcon.defaultProps = {
  className: '',
  isOpen: false,
};

KebabMenuIcon.propTypes = {
  className: PropTypes.string,
  isOpen: PropTypes.bool,
};

export default memo(KebabMenuIcon);
