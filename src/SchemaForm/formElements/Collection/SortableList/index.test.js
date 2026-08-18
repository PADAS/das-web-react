import React from 'react';
import { Accessibility, AutoScroller, Cursor, KeyboardSensor, PointerSensor } from '@dnd-kit/dom';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { Provider } from 'react-redux';
import { useSortable } from '@dnd-kit/react/sortable';

import { FORM_ELEMENT_TYPES } from '../../../../utils/form-schemas/constants';
import { GPS_FORMATS } from '../../../../utils/location';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { render, screen } from '../../../../test-utils';

import SortableList from './';

jest.mock('@dnd-kit/react', () => ({
  DragDropProvider: jest.fn(),
  DragOverlay: jest.fn(),
}));

jest.mock('@dnd-kit/react/sortable', () => ({
  ...jest.requireActual('@dnd-kit/react/sortable'),
  useSortable: jest.fn(),
}));

describe('SchemaForm - formElements - Collection - SortableList', () => {
  const focusLocationMarker = jest.fn();
  const onItemChange = jest.fn();
  const onItemDelete = jest.fn();
  const onItemMove = jest.fn();
  const renderFormElement = jest.fn();
  const setIsItemFormModalOpen = jest.fn();
  const setIsItemFormPreviewOpen = jest.fn();

  // Stand in for the sortable objects and the drag events the library reports. The library exposes the cancelation both
  // on the event and on the operation snapshot it carries.
  const sortable = (id, index, initialIndex = index) => ({ id, index, initialIndex });
  const dragEvent = ({ canceled = false, source, target }) => ({ canceled, operation: { canceled, source, target } });

  let collectionDetails, dragOverlaySource, items, store;
  beforeEach(() => {
    dragOverlaySource = null;
    DragDropProvider.mockImplementation(({ children }) => children);
    DragOverlay.mockImplementation(({ children }) => dragOverlaySource && children(dragOverlaySource));
    useSortable.mockImplementation(() => ({ isDragging: false, ref: () => {} }));

    focusLocationMarker.mockImplementation(() => jest.fn());

    collectionDetails = {
      columns: 1,
      itemIdentifier: 'collection-1.field-1',
      itemName: 'Item',
      leftColumn: ['collection-1.field-1'],
      rightColumn: [],
      value: 'collection-1',
    };
    items = [
      { formData: { 'field-1': 'First' }, id: 0, isFormPreviewOpen: false },
      { formData: { 'field-1': 'Second' }, id: 1, isFormPreviewOpen: false },
      { formData: { 'field-1': 'Third' }, id: 2, isFormPreviewOpen: false },
    ];

    store = {
      view: {
        coordinateReferenceSystems: {
          storedSystems: [],
        },
        modals: {
          canShowModals: true,
        },
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  const sortableList = () => <Provider store={mockStore(store)}>
    <SortableList
      breadcrumbs={[]}
      collectionDetails={collectionDetails}
      focusLocationMarker={focusLocationMarker}
      formElements={{
        'collection-1.field-1': {
          details: {
            label: 'Field 1',
            value: 'field-1',
          },
          type: FORM_ELEMENT_TYPES.TEXT,
        },
      }}
      items={items}
      onItemChange={onItemChange}
      onItemDelete={onItemDelete}
      onItemMove={onItemMove}
      readOnly={false}
      renderFormElement={renderFormElement}
      setIsItemFormModalOpen={setIsItemFormModalOpen}
      setIsItemFormPreviewOpen={setIsItemFormPreviewOpen}
    />
  </Provider>;

  const getProviderProp = (propName) => DragDropProvider.mock.calls[0][0][propName];

  const getAnnouncements = () => getProviderProp('plugins')([])
    .find(({ plugin }) => plugin === Accessibility)
    .options
    .announcements;

  test('updates the items when moving a dragged item to a new position', async () => {
    render(sortableList());

    getProviderProp('onDragEnd')(dragEvent({ source: sortable(0, 2, 0), target: sortable(0, 2, 0) }));

    expect(onItemMove).toHaveBeenCalledTimes(1);
    expect(onItemMove).toHaveBeenCalledWith(0, 2);
  });

  test('updates the items using the drop target position when the sorting has not projected a new index yet', async () => {
    render(sortableList());

    getProviderProp('onDragEnd')(dragEvent({ source: sortable(2, 2), target: sortable(0, 0) }));

    expect(onItemMove).toHaveBeenCalledTimes(1);
    expect(onItemMove).toHaveBeenCalledWith(2, 0);
  });

  test('does not update the items when the dragged item id cannot be found', async () => {
    render(sortableList());

    getProviderProp('onDragEnd')(dragEvent({ source: sortable('unknown', 2, 0), target: sortable(1, 1) }));

    expect(onItemMove).not.toHaveBeenCalled();
  });

  test('does not update the items when moving a dragged item to the same position', async () => {
    render(sortableList());

    getProviderProp('onDragEnd')(dragEvent({ source: sortable(1, 1), target: sortable(1, 1) }));

    expect(onItemMove).not.toHaveBeenCalled();
  });

  test('does not update the items when the drag is canceled', async () => {
    render(sortableList());

    getProviderProp('onDragEnd')(dragEvent({ canceled: true, source: sortable(0, 2, 0), target: sortable(0, 2, 0) }));

    expect(onItemMove).not.toHaveBeenCalled();
  });

  test('does not update the items when the drag ends outside the list', async () => {
    render(sortableList());

    getProviderProp('onDragEnd')(dragEvent({ source: sortable(0, 2, 0) }));

    expect(onItemMove).not.toHaveBeenCalled();
  });

  test('disables auto scrolling', async () => {
    render(sortableList());

    const plugins = getProviderProp('plugins')([AutoScroller, Cursor]);

    expect(plugins).toContain(Cursor);
    expect(plugins).not.toContain(AutoScroller);
  });

  test('announces a drag start', async () => {
    render(sortableList());

    expect(getAnnouncements().dragstart(dragEvent({ source: sortable(1, 1) })))
      .toBe('Picked up Second. Position 2 of 3.');
  });

  test('announces a drag over', async () => {
    render(sortableList());

    expect(getAnnouncements().dragover(dragEvent({ source: sortable(1, 1), target: sortable(2, 2) })))
      .toBe('Second was moved into position 3 of 3.');
  });

  test('announces a drag cancel', async () => {
    render(sortableList());

    expect(getAnnouncements().dragend(dragEvent({ canceled: true, source: sortable(1, 2, 1) })))
      .toBe('Dragging was cancelled. Second was returned to position 2 of 3.');
  });

  test('announces a drag end outside', async () => {
    render(sortableList());

    expect(getAnnouncements().dragend(dragEvent({ source: sortable(1, 2, 1) })))
      .toBe('Second was dropped and returned to position 2 of 3.');
  });

  test('announces a drag end on a target', async () => {
    render(sortableList());

    expect(getAnnouncements().dragend(dragEvent({ source: sortable(1, 2, 1), target: sortable(1, 2, 1) })))
      .toBe('Second was dropped at position 3 of 3.');
  });

  test('provides the screen reader draggable instructions', async () => {
    render(sortableList());

    const { screenReaderInstructions } = getProviderProp('plugins')([])
      .find(({ plugin }) => plugin === Accessibility)
      .options;

    expect(screenReaderInstructions.draggable).toBe(
      'To pick up a Item, press the space bar. While dragging, use the up and down arrow keys to move the Item in a '
      + 'given direction. Press space again to drop the Item in its new position, or press escape to cancel.'
    );
  });

  test('keeps the KeyboardSensor and configures the PointerSensor to make the entire sortable item the activator element', async () => {
    render(sortableList());

    const sensors = getProviderProp('sensors')([PointerSensor, KeyboardSensor]);

    expect(sensors).toContain(KeyboardSensor);
    expect(sensors).not.toContain(PointerSensor);
    expect(sensors.at(-1).plugin).toBe(PointerSensor);
    expect(sensors.at(-1).options.activatorElements({ element: 'the item row' })).toEqual(['the item row']);
  });

  test('renders one sortable item per collection item', async () => {
    render(sortableList());

    expect(await screen.findAllByTestId('schema-form-collection-item')).toHaveLength(3);
  });

  test('passes each item its position index, independent of its id', async () => {
    items = [
      { formData: { 'field-1': 'First' }, id: 5, isFormPreviewOpen: false },
      { formData: { 'field-1': 'Second' }, id: 8, isFormPreviewOpen: false },
      { formData: { 'field-1': 'Third' }, id: 12, isFormPreviewOpen: false },
    ];
    render(sortableList());

    expect(useSortable.mock.calls.map(([{ id, index }]) => ({ id, index }))).toEqual([
      { id: 5, index: 0 },
      { id: 8, index: 1 },
      { id: 12, index: 2 },
    ]);
  });

  test('points each item chevron at its own form preview when the items share a title', async () => {
    items = [
      { formData: { 'field-1': 'Same' }, id: 0, isFormPreviewOpen: false },
      { formData: { 'field-1': 'Same' }, id: 1, isFormPreviewOpen: false },
    ];
    render(sortableList());

    const [first, second] = await screen.findAllByRole('button', { name: 'Open the Same form preview' });

    expect(first.getAttribute('aria-controls')).not.toBe(second.getAttribute('aria-controls'));
    expect(document.getElementById(first.getAttribute('aria-controls'))).toBeInTheDocument();
    expect(document.getElementById(second.getAttribute('aria-controls'))).toBeInTheDocument();
  });

  test('renders the dragged item in the drag overlay', async () => {
    dragOverlaySource = sortable(1, 1);
    render(sortableList());

    expect((await screen.findAllByTestId('schema-form-collection-item')).at(-1)).toHaveClass('dragOverlay');
  });
});
