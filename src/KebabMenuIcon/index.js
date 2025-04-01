import React, { forwardRef, memo } from 'react';

import * as styles from './styles.module.scss';

// eslint-disable-next-line react/display-name
const KebabMenuIcon = forwardRef(({ isOpen = false, className = '', ...rest }, ref) => <div
    ref={ref}
    className={`${styles.kebab}${className ? ` ${className}` : ''}${isOpen ? ` ${styles.open}` : ''}`}
    {...rest}
  >
  <span></span>
</div>
);

export default memo(KebabMenuIcon);
