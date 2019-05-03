import React from 'react';
import PropTypes from 'prop-types';

import CheckMark from '../Checkmark';
import { uuid } from '../utils/string';

const CheckableList = (props) => {
  const { items, itemProps, onCheckClick, itemFullyChecked, itemPartiallyChecked, itemComponent: ItemComponent, className } = props;
  return <ul className={className}>
    {items.map((item) => {
      const fullyChecked = itemFullyChecked(item);
      const partiallyChecked = itemPartiallyChecked(item);
      const onClick = (e) => e.stopPropagation && onCheckClick(item);

      return <li key={item.id || uuid()}>
        <CheckMark fullyChecked={fullyChecked} partiallyChecked={partiallyChecked} onClick={onClick} />
        <ItemComponent {...item} {...itemProps} />
      </li>
    })}
  </ul>;

};

export default CheckableList;

CheckableList.defaultProps = {
  itemPartiallyChecked() {
    return false;
  },
  onCheckClick(item) {
    console.log('check clicked', item);
  },
  itemProps: {},
};

CheckableList.propTypes = {
  itemFullyChecked: PropTypes.func.isRequired,
  itemPartiallyChecked: PropTypes.func,
  itemComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  items: PropTypes.array.isRequired,
  onCheckClick: PropTypes.func,
  itemProps: PropTypes.object,
};