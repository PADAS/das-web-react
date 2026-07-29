import React from 'react';
import { directionBiased } from '@dnd-kit/collision';
import { Provider } from 'react-redux';
import { useSortable } from '@dnd-kit/react/sortable';

import { render, screen } from '../../../../../../../test-utils';
import { GPS_FORMATS } from '../../../../../../../utils/location';
import { mockStore } from '../../../../../../../__test-helpers/MockStore';
import { FORM_ELEMENT_TYPES } from '../../../../../../../utils/v2-event-schemas/constants';

import SortableItem from './';

jest.mock('@dnd-kit/react/sortable', () => ({
  ...jest.requireActual('@dnd-kit/react/sortable'),
  useSortable: jest.fn(),
}));

describe('ReportManager - DetailsSection - SchemaForm - formElements - Collection - SortableList - SortableItem', () => {
  const renderFormElement = jest.fn();

  let collectionDetails, handleRef, ref, store;
  beforeEach(() => {
    handleRef = jest.fn();
    ref = jest.fn();
    useSortable.mockImplementation(() => ({ handleRef, isDragging: true, ref }));
    collectionDetails = {
      columns: 1,
      itemIdentifier: 'field-1',
      itemName: 'Collection 1',
      leftColumn: ['field-1', 'field-2'],
      rightColumn: [],
    };

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

  const renderSortableItem = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <SortableItem
        breadcrumbs={[{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }]}
        collectionDetails={collectionDetails}
        errors={undefined}
        formData={{ 'field-1': 'Value 1', 'field-2': 'Value 2' }}
        formElements={{
          'field-1': {
            details: {
              label: 'Field 1',
            },
            type: FORM_ELEMENT_TYPES.TEXT,
          },
          'field-2': {
            details: {
              label: 'Field 2',
            },
            type: FORM_ELEMENT_TYPES.TEXT,
          },
        }}
        id={1}
        index={2}
        isDragOverlay={false}
        isFormModalOpen={false}
        isFormPreviewOpen={false}
        readOnly={false}
        renderFormElement={renderFormElement}
        {...props}
      />
    </Provider>
  );

  test('registers as a sortable and injects the sortable properties to the item component', async () => {
    renderSortableItem();

    const item = screen.getByTestId('schema-form-collection-item');

    expect(useSortable).toHaveBeenCalledTimes(1);
    expect(useSortable).toHaveBeenCalledWith({
      collisionDetector: directionBiased,
      disabled: false,
      id: 1,
      index: 2,
    });
    expect(item).toHaveClass('isDragging');
    expect(ref).toHaveBeenCalledWith(item);
  });

  test('connects the sortable handle to the item drag handle button', async () => {
    renderSortableItem();

    expect(handleRef).toHaveBeenCalledWith(screen.getByRole('button', { name: 'Reorder Collection 1 2' }));
  });

  test('disables the sortable if the form modal is open', async () => {
    renderSortableItem({ isFormModalOpen: true });

    expect(useSortable).toHaveBeenCalledTimes(1);
    expect(useSortable).toHaveBeenCalledWith({
      collisionDetector: directionBiased,
      disabled: true,
      id: 1,
      index: 2,
    });
  });

  test('disables the sortable if the collection is read only', async () => {
    renderSortableItem({ readOnly: true });

    expect(useSortable).toHaveBeenCalledTimes(1);
    expect(useSortable).toHaveBeenCalledWith({
      collisionDetector: directionBiased,
      disabled: true,
      id: 1,
      index: 2,
    });
  });
});
