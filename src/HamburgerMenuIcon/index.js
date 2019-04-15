import React from 'react';
import styles from './styles.module.scss';

export default (props) => {
  const { isOpen, className, ...rest } = props;
  return <button className={`${styles.hamburger}${className ? ` ${className}` : ''}${isOpen ? ` ${styles.open}` : ''}`} {...rest}>
    <span></span>
    </button>;
};