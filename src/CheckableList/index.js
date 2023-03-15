import React, { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import CheckMark from '../Checkmark';
import { hashCode } from '../utils/string';

const Item = memo(({ item, itemProps, onCheckClick, itemFullyChecked, itemComponent: ItemComponent, itemPartiallyChecked }) => { /* eslint-disable-line react/display-name */
  const fullyChecked = useMemo(() => itemFullyChecked(item), [item, itemFullyChecked]);
  const partiallyChecked = useMemo(() => itemPartiallyChecked(item), [item, itemPartiallyChecked]);

  const onClick = useCallback(() => onCheckClick(item), [onCheckClick, item]);

  return <li>
    <CheckMark fullyChecked={fullyChecked} partiallyChecked={partiallyChecked} onClick={onClick} />
    <ItemComponent {...item} {...itemProps} />
  </li>;
});


const CheckableList = (props) => {
  const { items, itemProps, onCheckClick, itemFullyChecked, itemPartiallyChecked, itemComponent: ItemComponent, className } = props;
  return <ul className={className}>
    {items.map((item, index) =>
      <Item item={item} itemProps={itemProps} onCheckClick={onCheckClick} key={item.id || `${hashCode(item.toString())}-${index}`}
      itemFullyChecked={itemFullyChecked} itemComponent={ItemComponent}
      itemPartiallyChecked={itemPartiallyChecked} />
    )}
  </ul>;

};

export default memo(CheckableList);

CheckableList.defaultProps = {
  itemPartiallyChecked() {
    return false;
  },
  onCheckClick() {
  },
  itemProps: {},
};

CheckableList.propTypes = {
  itemFullyChecked: PropTypes.func.isRequired,
  itemPartiallyChecked: PropTypes.func,
  itemComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
  items: PropTypes.array.isRequired,
  onCheckClick: PropTypes.func,
  itemProps: PropTypes.object,
};