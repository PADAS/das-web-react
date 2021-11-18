import React, { memo } from 'react';
import { InputGroup } from 'react-bootstrap';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const CheckboxList = ({ onItemChange, options, values }) => {
  const renderedOptions = options.map((item, index) => <li key={item.id}>
    <InputGroup.Checkbox checked={values.includes(item.id)} onChange={() => onItemChange(item, index)} />
    {item.value}
  </li>);

  return <InputGroup as='ul' className={styles.checkBoxList}>
    {renderedOptions}
  </InputGroup>;
};

CheckboxList.propTypes = {
  values: PropTypes.arrayOf(PropTypes.string),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    }).isRequired,
  ),
  onItemChange: PropTypes.func.isRequired,
};

export default memo(CheckboxList);
