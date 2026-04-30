import React from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

import { BOOTSTRAP_DEFAULTS } from '../../../../../../../constants';

import Item from '../Item';

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
      transition: `${transition}, margin ${BOOTSTRAP_DEFAULTS.COLLAPSE_TRANSITION_TIME}ms`,
    }}
    {...attributes}
    // If the form modal is open we ignore the drag and drop listeners since they may interfere with actions inside the
    // modal.
    {...(isFormModalOpen ? {} : listeners)}
    {...otherProps}
  />;
};

export default SortableItem;
