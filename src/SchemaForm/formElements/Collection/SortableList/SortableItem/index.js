import React from 'react';
import { directionBiased } from '@dnd-kit/collision';
import { useSortable } from '@dnd-kit/react/sortable';

import Item from '../Item';

const SortableItem = ({ id, index, isFormModalOpen = false, readOnly, ...otherProps }) => {
  const { handleRef, isDragging, ref } = useSortable({
    // Known issue: dragging over a taller item makes the list flicker.
    // https://github.com/clauderic/dnd-kit/issues/1950
    collisionDetector: directionBiased,
    disabled: isFormModalOpen || readOnly,
    id,
    index,
  });

  return <Item
    handleRef={handleRef}
    id={id}
    index={index}
    isDragging={isDragging}
    isFormModalOpen={isFormModalOpen}
    readOnly={readOnly}
    ref={ref}
    {...otherProps}
  />;
};

export default SortableItem;
