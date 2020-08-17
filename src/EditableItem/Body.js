import React, { forwardRef, memo } from 'react';

import styles from './styles.module.scss';

const Body = (props, ref) => {
  const { children } = props;

  return <div className={styles.formScrollContainer} ref={ref}>
    {children}
  </div>;
};

export default memo(forwardRef(Body));