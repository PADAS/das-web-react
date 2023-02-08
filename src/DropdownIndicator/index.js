import React, { memo } from 'react';
import { components } from 'react-select';
import styles from './styles.module.scss';

const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <div className={styles.caret} />
    </components.DropdownIndicator>
  );
};

export default memo(DropdownIndicator);
