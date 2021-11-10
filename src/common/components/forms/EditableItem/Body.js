import React, { forwardRef, memo } from 'react';

import styles from './styles.module.scss';

const Body = (props, ref) => {
  const { children, className = '' } = props;

  return <div className={`${styles.formScrollContainer} ${className}`} ref={ref}>
    {children}
  </div>;
};

export default memo(forwardRef(Body));