import React, { memo } from 'react';
import { InputGroup } from 'react-bootstrap';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const CheckboxList = ({ items, onItemClick }) => <InputGroup as='ul' className={styles.checkBoxList}>
  {items.map((item, index) => <li key={item.id}>
    <InputGroup.Checkbox checked={item.checked} onChange={() => onItemClick(item, index)} />
    {item.value}
  </li>)}
</InputGroup>;

CheckboxList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      checked: PropTypes.bool,
      id: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    }).isRequired,
  ),
  onItemClick: PropTypes.func.isRequired,
};

export default memo(CheckboxList);
