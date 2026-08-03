import React, { useEffect, useRef } from 'react';
import { Accessibility, AutoScroller, PointerSensor } from '@dnd-kit/dom';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { getItemTitle } from './Item/utils';
import { selectCoordinatesRepresentation } from '../../../../selectors/location';

import Item from './Item';
import SortableItem from './SortableItem';

import * as styles from './styles.module.scss';

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
  const { i18n, t } = useTranslation('schema-form', {
    keyPrefix: 'fields.collection.sortableList',
  });

  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);

  // The accessibility plugin captures its announcement callbacks once, so we read
  // values that can change afterwards through refs.
  const coordinatesRepresentationRef = useRef(coordinatesRepresentation);
  const itemsRef = useRef(items);
  const languageRef = useRef(i18n.language);

  const getActiveItemTitle = (activeItemId) => {
    const activeItem = itemsRef.current.find((item) => item.id === activeItemId);
    const itemIdentifierFieldName = collectionDetails.itemIdentifier
      ? formElements[collectionDetails.itemIdentifier].details.value
      : null;

    return getItemTitle(
      activeItem.formData,
      itemIdentifierFieldName,
      `${collectionDetails.itemName} ${activeItem.id + 1}`,
      formElements[collectionDetails.itemIdentifier],
      languageRef.current,
      coordinatesRepresentationRef.current,
      t
    );
  };

  const onDragEnd = (event) => {
    const movedItems = move(items, event);
    if (movedItems !== items) {
      const movedItem = items.find((item) => item.id === event.operation.source.id);
      if (movedItem) {
        onItemMove(items.indexOf(movedItem), movedItems.indexOf(movedItem));
      }
    }
  };

  useEffect(() => {
    coordinatesRepresentationRef.current = coordinatesRepresentation;
    itemsRef.current = items;
    languageRef.current = i18n.language;
  }, [coordinatesRepresentation, i18n.language, items]);

  return <DragDropProvider
      onDragEnd={onDragEnd}
      plugins={(defaults) => [
        ...defaults.filter((plugin) => plugin !== AutoScroller),
        Accessibility.configure({
          announcements: {
            dragstart: (event) => t('dragStartAnnouncement', {
              activeItemPosition: event.operation.source.index + 1,
              activeItemTitle: getActiveItemTitle(event.operation.source.id),
              itemsLength: itemsRef.current.length,
            }),
            dragover: (event) => {
              if (event.operation.target) {
                return t('dragOverAnnouncement', {
                  activeItemTitle: getActiveItemTitle(event.operation.source.id),
                  itemsLength: itemsRef.current.length,
                  overItemPosition: event.operation.target.index + 1,
                });
              }
            },
            dragend: (event) => {
              if (event.canceled) {
                return t('dragCancelAnnouncement', {
                  activeItemPosition: event.operation.source.initialIndex + 1,
                  activeItemTitle: getActiveItemTitle(event.operation.source.id),
                  itemsLength: itemsRef.current.length,
                });
              }

              if (!event.operation.target) {
                return t('dragEndOutsideAnnouncement', {
                  activeItemPosition: event.operation.source.initialIndex + 1,
                  activeItemTitle: getActiveItemTitle(event.operation.source.id),
                  itemsLength: itemsRef.current.length,
                });
              }

              return t('dragEndAnnouncement', {
                activeItemTitle: getActiveItemTitle(event.operation.source.id),
                itemsLength: itemsRef.current.length,
                overItemPosition: event.operation.target.index + 1,
              });
            },
          },
          screenReaderInstructions: {
            draggable: t('draggableScreenReaderInstructions', { itemName: collectionDetails.itemName }),
          },
        }),
      ]}
      sensors={(defaults) => [
        ...defaults.filter((sensor) => sensor !== PointerSensor),
        // For pointer sensors (mouse, touch, pen), make the entire sortable
        // item the activator element and not just the drag handle.
        PointerSensor.configure({ activatorElements: (source) => [source.element] }),
      ]}
    >
    <ul>
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
    </ul>

    <DragOverlay className={styles.dragOverlay} tag="ul">
      {(source) => {
        const activeItem = items.find((item) => item.id === source.id);

        return activeItem ? <Item
          collectionDetails={collectionDetails}
          errors={activeItem.error}
          formData={activeItem.formData}
          formElements={formElements}
          id={activeItem.id}
          isDragOverlay
          isFormPreviewOpen={activeItem.isFormPreviewOpen}
        /> : null;
      }}
    </DragOverlay>
  </DragDropProvider>;
};

export default SortableList;
