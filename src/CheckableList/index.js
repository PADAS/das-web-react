import React from 'react';
import PropTypes from 'prop-types';

import CheckMark from '../Checkmark';
import { uuid } from '../utils/string';

const CheckableList = (props) => {
  const { items, onCheckClick, itemIsChecked, itemComponent: ItemComponent, itemRenderFunc, className } = props;
  return <ul className={className}>
    {items.map((item) => {
      return <li key={item.id || uuid()}>
        <CheckMark checked={itemIsChecked(item)} onClick={() => onCheckClick(item)} />
        {itemRenderFunc ? itemRenderFunc(item) : <ItemComponent {...item} />}
      </li>
    })}
  </ul>;

};

export default CheckableList;

CheckableList.propTypes = {
  itemIsChecked: PropTypes.func.isRequired,
  itemComponent: PropTypes.object,
  itemRenderFunc: PropTypes.func,
  items: PropTypes.array.isRequired,
  onCheckClick: PropTypes.func,
};