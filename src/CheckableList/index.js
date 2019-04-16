import React from 'react';
import PropTypes from 'prop-types';

import CheckMark from '../Checkmark';
import { uuid } from '../utils/string';

const CheckableList = (props) => {
  const { items, onCheckClick, itemFullyChecked, itemPartiallyChecked, itemComponent: ItemComponent, className } = props;
  return <ul className={className}>
    {items.map((item) => {
      return <li key={item.id || uuid()}>
        <CheckMark fullyChecked={itemFullyChecked(item)} partiallyChecked={itemPartiallyChecked(item)} onClick={() => onCheckClick(item)} />
        <ItemComponent {...item} />
      </li>
    })}
  </ul>;

};

export default CheckableList;

CheckableList.propTypes = {
  itemFullyChecked: PropTypes.func.isRequired,
  itemPartiallyChecked: PropTypes.func.isRequired,
  itemComponent: PropTypes.object,
  items: PropTypes.array.isRequired,
  onCheckClick: PropTypes.func,
};