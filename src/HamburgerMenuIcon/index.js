import React, { forwardRef, memo } from 'react';
import styles from './styles.module.scss';

const HamburgerMenuIcon = (props, ref) => {
  const { isOpen, className, ...rest } = props;

  return <button ref={ref} 
    className={`${styles.hamburger}${className ? ` ${className}` : ''}${isOpen ? ` ${styles.open}` : ''}`} {...rest}>
    <span></span>
  </button>;
};

export default memo(forwardRef(HamburgerMenuIcon));