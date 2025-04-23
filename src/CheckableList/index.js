import React, { memo } from 'react';

import { hashCode } from '../utils/string';

import CheckMark from '../Checkmark';

const CheckableList = ({
  className,
  itemComponent: ItemComponent,
  itemFullyChecked,
  itemPartiallyChecked = null,
  itemProps = {},
  items,
  onCheckClick = null,
}) => <ul className={className}>
  {items.map((item) => {
    const fullyChecked = itemFullyChecked(item);
    const partiallyChecked = itemPartiallyChecked?.(item);

    return <li key={item.id || hashCode(item.toString())}>
      <CheckMark
        fullyChecked={fullyChecked}
        onClick={() => onCheckClick?.(item)}
        partiallyChecked={partiallyChecked}
      />

      <ItemComponent {...item} {...itemProps} />
    </li>;
  })}
</ul>;

export default memo(CheckableList);
