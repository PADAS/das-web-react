import React from 'react';

import * as styles from './styles.module.scss';

const HamburgerMenuIcon = ({ className = '', isOpen = false, ref, ...restProps }) => <button
    ref={ref}
    className={`${styles.hamburger}${className ? ` ${className}` : ''}${isOpen ? ` ${styles.open}` : ''}`}
    {...restProps}
  >
  <span></span>
</button>;

export default HamburgerMenuIcon;
