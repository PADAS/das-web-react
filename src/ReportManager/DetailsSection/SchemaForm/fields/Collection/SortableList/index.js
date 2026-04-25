import React, { useState } from 'react';
import {
  closestCenter,
  defaultDropAnimation,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { BOOTSTRAP_DEFAULTS } from '../../../../../../constants';
import { getItemTitle } from './Item/utils';
import { selectCoordinatesRepresentation } from '../../../../../../selectors/location';

import Item from './Item';
import SortableItem from './SortableItem';

const ITEM_HEADER_HEIGHT = 40;

const customKeyboardCoordinateGetter = (event, args) => {
  switch (event.code) {
  case 'ArrowDown':
    return { ...args.currentCoordinates, y: args.currentCoordinates.y + ITEM_HEADER_HEIGHT };

  case 'ArrowUp':
    return { ...args.currentCoordinates, y: args.currentCoordinates.y - ITEM_HEADER_HEIGHT };

  default:
    return undefined;
  }
};

const SortableList = ({
  blurLocationMarker,
  breadcrumbs,
  collectionDetails,
  focusLocationMarker,
  formElements,
  items,
  onItemChange,
  onItemDelete,
  onItemMove,
  readOnly,
  renderFormElement,
  setIsItemFormModalOpen,
  setIsItemFormPreviewOpen,
}) => {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: customKeyboardCoordinateGetter,
    }),
  );
  const { i18n, t } = useTranslation('reports', {
    keyPrefix: 'reportManager.detailsSection.schemaForm.fields.collection.sortableList',
  });

  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);

  const [activeItemIndex, setActiveItemIndex] = useState(null);

  // Utility to calculate variables needed for a11y announcements on drag operations.
  const getActiveItemAnnouncementData = (activeId, overId = null) => {
    const activeItemIndex = items.findIndex((item) => item.id === activeId);
    const itemIdentifierFieldName = collectionDetails.itemIdentifier
      ? formElements[collectionDetails.itemIdentifier].details.value
      : null;

    return [
      activeItemIndex + 1,
      getItemTitle(
        items[activeItemIndex].formData,
        itemIdentifierFieldName,
        `${collectionDetails.itemName} ${items[activeItemIndex].id + 1}`,
        formElements[collectionDetails.itemIdentifier],
        i18n.language,
        coordinatesRepresentation,
        t
      ),
      ...(overId === null ? [] : [items.findIndex((item) => item.id === overId) + 1]),
    ];
  };

  const dndAnnouncements = {
    onDragStart: (event) => {
      const [activeItemPosition, activeItemTitle] = getActiveItemAnnouncementData(event.active.id);
      return t('dragStartAnnouncement', { activeItemPosition, activeItemTitle, itemsLength: items.length });
    },
    onDragOver: (event) => {
      if (event.over) {
        const [_, activeItemTitle, overItemPosition] = getActiveItemAnnouncementData(event.active.id, event.over.id);
        return t('dragOverAnnouncement', { activeItemTitle, itemsLength: items.length, overItemPosition });
      }
    },
    onDragEnd: (event) => {
      if (event.over) {
        const [_, activeItemTitle, overItemPosition] = getActiveItemAnnouncementData(event.active.id, event.over.id);
        return t('dragEndAnnouncement', { activeItemTitle, itemsLength: items.length, overItemPosition });
      }
    },
    onDragCancel: (event) => {
      const [_, activeItemTitle] = getActiveItemAnnouncementData(event.active.id);
      return t('dragCancelAnnouncement', { activeItemTitle });
    },
  };

  const onDragEnd = (event) => {
    if (event.active.id !== event.over.id) {
      const overItemIndex = items.findIndex((item) => item.id === event.over.id);
      onItemMove(activeItemIndex, overItemIndex);
    }

    setActiveItemIndex(null);
  };

  return <ul>
    <DndContext
      accessibility={{
        announcements: dndAnnouncements,
        screenReaderInstructions: {
          draggable: t('draggableScreenReaderInstructions', { itemName: collectionDetails.itemName }),
        },
      }}
      autoScroll={false}
      collisionDetection={closestCenter}
      sensors={readOnly ? [] : sensors}
      onDragCancel={() => setActiveItemIndex(null)}
      onDragEnd={onDragEnd}
      onDragStart={(event) => setActiveItemIndex(items.findIndex((item) => item.id === event.active.id))}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        {items.map((item, index) => <SortableItem
          blurLocationMarker={blurLocationMarker}
          breadcrumbs={breadcrumbs}
          collectionDetails={collectionDetails}
          errors={item.error}
          focusLocationMarker={focusLocationMarker(index)}
          formData={item.formData}
          formElements={formElements}
          id={item.id}
          index={index}
          isFormModalOpen={item.isFormModalOpen}
          isFormPreviewOpen={item.isFormPreviewOpen}
          key={item.id}
          onChange={onItemChange(index)}
          onDelete={onItemDelete(index)}
          readOnly={readOnly}
          renderFormElement={renderFormElement}
          setIsFormModalOpen={setIsItemFormModalOpen(index)}
          setIsFormPreviewOpen={setIsItemFormPreviewOpen(index)}
          wasItemRecentlyAdded={item.wasItemRecentlyAdded}
        />)}
      </SortableContext>

      {createPortal(
        <DragOverlay
          dropAnimation={{
            ...defaultDropAnimation,
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: 0.5,
                },
              },
            }),
          }}
          wrapperElement="ul"
          zIndex={BOOTSTRAP_DEFAULTS.MODAL_ZINDEX + 1}
        >
          {activeItemIndex !== null ? <Item
            collectionDetails={collectionDetails}
            errors={items[activeItemIndex].error}
            formData={items[activeItemIndex].formData}
            formElements={formElements}
            id={items[activeItemIndex].id}
            isDragOverlay
            isFormPreviewOpen={items[activeItemIndex].isFormPreviewOpen}
          /> : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  </ul>;
};

export default SortableList;
