import React, { memo } from 'react';

import * as styles from './styles.module.scss';

const KebabMenuIcon = ({ isOpen = false, className = '', ref, ...rest }) => <div
    ref={ref}
    className={`${styles.kebab}${className ? ` ${className}` : ''}${isOpen ? ` ${styles.open}` : ''}`}
    {...rest}
  >
  <span></span>
</div>;

export default memo(KebabMenuIcon);
