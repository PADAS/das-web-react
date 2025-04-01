import React, { forwardRef } from 'react';

import * as styles from './styles.module.scss';

const HamburgerMenuIcon = ({ className = '', isOpen = false, ...restProps }, ref) => <button
    ref={ref}
    className={`${styles.hamburger}${className ? ` ${className}` : ''}${isOpen ? ` ${styles.open}` : ''}`}
    {...restProps}
  >
  <span></span>
</button>;

const HamburgerMenuIconForwardRef = forwardRef(HamburgerMenuIcon);

export default HamburgerMenuIconForwardRef;