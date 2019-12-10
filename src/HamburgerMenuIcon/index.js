import React, { forwardRef } from 'react';
import styles from './styles.module.scss';
import { trackEvent } from '../utils/analytics';

const HamburgerMenuIcon = forwardRef((props, ref) => {
  const { isOpen, className, ...rest } = props;

  return <button ref={ref} 
    className={`${styles.hamburger}${className ? ` ${className}` : ''}${isOpen ? ` ${styles.open}` : ''}`} {...rest}>
    <span></span>
  </button>;
});

export default HamburgerMenuIcon;