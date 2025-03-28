import React, { memo } from 'react';

import * as styles from './styles.module.scss';

const EditableItemModal = (props) => {
  const { children, readonly } = props;

  return  <div className={`${styles.wrapper} ${readonly ? styles.readonly : ''}`}>
    {children}
  </div>;
};

export default memo(EditableItemModal);