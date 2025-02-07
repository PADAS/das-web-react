import React from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

import Item from '../Item';

const BOOTSTRAP_COLLAPSE_TRANSITION_TIME = '300ms';

const SortableItem = ({ id, isFormModalOpen = false, ...otherProps }) => {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  return <Item
    id={id}
    isDragging={isDragging}
    isFormModalOpen={isFormModalOpen}
    ref={setNodeRef}
    style={{
      transform: CSS.Translate.toString(transform),
      transition: `${transition}, margin ${BOOTSTRAP_COLLAPSE_TRANSITION_TIME}`,
    }}
    {...attributes}
    // If the form modal is open we ignore the drag and drop listeners since they may interfere with actions inside the
    // modal.
    {...(isFormModalOpen ? {} : listeners)}
    {...otherProps}
  />;
};

export default SortableItem;
