import React, { memo } from 'react';

import styles from './styles.module.scss';

const EditableItemModal = (props) => {
  const { children } = props;

  return  <div className={styles.wrapper}>
    {children}
  </div>;
};

export default memo(EditableItemModal);