import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const HamburgerMenuIcon = ({ className, isOpen, ...restProps }, ref) => <button
    ref={ref}
    className={`${styles.hamburger}${className ? ` ${className}` : ''}${isOpen ? ` ${styles.open}` : ''}`}
    {...restProps}
  >
  <span></span>
</button>;

const HamburgerMenuIconForwardRef = forwardRef(HamburgerMenuIcon);

HamburgerMenuIconForwardRef.defaultProps = {
  className: '',
  isOpen: false,
};

HamburgerMenuIconForwardRef.propTypes = {
  className: PropTypes.string,
  isOpen: PropTypes.bool,
};

export default HamburgerMenuIconForwardRef;