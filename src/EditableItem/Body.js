import React, { memo } from 'react';

import * as styles from './styles.module.scss';

const Body = ({ children, className = '', ref }) => <div
    className={`${styles.formScrollContainer} ${className}`}
    ref={ref}
  >
  {children}
</div>;

export default memo(Body);
