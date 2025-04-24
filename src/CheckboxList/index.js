import React, { memo } from 'react';
import { InputGroup } from 'react-bootstrap';

import * as styles from './styles.module.scss';

const CheckboxList = ({ onItemChange, options, values }) => {
  const renderedOptions = options.map((item, index) => <li key={item.id}>
    <InputGroup.Checkbox checked={values.includes(item.id)} onChange={() => onItemChange(item, index)} />
    {item.value}
  </li>);

  return <InputGroup as='ul' className={styles.checkBoxList}>
    {renderedOptions}
  </InputGroup>;
};

export default memo(CheckboxList);
