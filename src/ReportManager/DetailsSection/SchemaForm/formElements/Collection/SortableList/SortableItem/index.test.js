import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import { useSortable } from '@dnd-kit/sortable';

import { render, screen } from '../../../../../../../test-utils';
import { GPS_FORMATS } from '../../../../../../../utils/location';
import { mockStore } from '../../../../../../../__test-helpers/MockStore';
import { FORM_ELEMENT_TYPES } from '../../../../../../../utils/v2-event-schemas/constants';

import SortableItem from './';

jest.mock('@dnd-kit/sortable', () => ({
  ...jest.requireActual('@dnd-kit/sortable'),
  useSortable: jest.fn(),
}));

describe('ReportManager - DetailsSection - SchemaForm - formElements - Collection - SortableList - SortableItem', () => {
  const renderFormElement = jest.fn();

  let attributes, collectionDetails, listeners, store, transform, transition;
  beforeEach(() => {
    attributes = { tabIndex: 0 };
    listeners = { onKeyDown: jest.fn() };
    transform = {};
    transition = 'transition 1s';
    useSortable.mockImplementation(() => ({
      attributes,
      isDragging: true,
      listeners,
      setNodeRef: () => {},
      transform,
      transition,
    }));
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
        isDragOverlay={false}
        isFormModalOpen={false}
        isFormPreviewOpen={false}
        renderFormElement={renderFormElement}
        {...props}
      />
    </Provider>
  );

  test('registers as a sortable and injects the sortable properties to the item component', async () => {
    renderSortableItem();

    const item = screen.getByTestId('schema-form-collection-item');

    expect(useSortable).toHaveBeenCalledTimes(1);
    expect(useSortable).toHaveBeenCalledWith({ id: 1 });
    expect(item).toHaveClass('isDragging');
    expect(item).toHaveAttribute('tabindex', '0');
    expect(item).toHaveAttribute('style', 'transform: translate3d(0px, 0px, 0); transition: transition 1s, margin 300ms;');

    await userEvent.type(item, 'a');

    expect(listeners.onKeyDown).toHaveBeenCalledTimes(1);
  });

  test('does not inject the listeners if the form modal is open', async () => {
    renderSortableItem({ isFormModalOpen: true });

    const item = screen.getByTestId('schema-form-collection-item');

    expect(useSortable).toHaveBeenCalledTimes(1);
    expect(useSortable).toHaveBeenCalledWith({ id: 1 });

    await userEvent.type(item, 'a');

    expect(listeners.onKeyDown).not.toHaveBeenCalled();
  });
});
