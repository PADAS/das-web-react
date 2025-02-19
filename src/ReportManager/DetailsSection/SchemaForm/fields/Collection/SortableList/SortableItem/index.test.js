import React from 'react';
import userEvent from '@testing-library/user-event';
import { useSortable } from '@dnd-kit/sortable';

import { render, screen } from '../../../../../../../test-utils';
import { FORM_ELEMENT_TYPES } from '../../../../constants';

import SortableItem from './';

jest.mock('@dnd-kit/sortable', () => ({
  ...jest.requireActual('@dnd-kit/sortable'),
  useSortable: jest.fn(),
}));

describe('ReportManager - DetailsSection - SchemaForm - fields - Collection - SortableList - SortableItem', () => {
  const renderField = jest.fn();

  let attributes, listeners, transform, transition, collectionDetails;
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
  });

  const renderSortableItem = (props) => render(<SortableItem
    breadcrumbs={[{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }]}
    collectionDetails={collectionDetails}
    errors={undefined}
    fields={{
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
    formData={{ 'field-1': 'Value 1', 'field-2': 'Value 2' }}
    id={1}
    isDragOverlay={false}
    isFormModalOpen={false}
    isFormPreviewOpen={false}
    renderField={renderField}
    {...props}
  />);

  test('registers as a sortable and injects the sortable properties to the item component', () => {
    renderSortableItem();

    const item = screen.getByTestId('schema-form-collection-item');

    expect(useSortable).toHaveBeenCalledTimes(1);
    expect(useSortable).toHaveBeenCalledWith({ id: 1 });
    expect(item).toHaveClass('isDragging');
    expect(item).toHaveAttribute('tabindex', '0');
    expect(item).toHaveAttribute('style', 'transform: translate3d(0px, 0px, 0); transition: transition 1s, margin 300ms;');

    userEvent.type(item, 'a');

    expect(listeners.onKeyDown).toHaveBeenCalledTimes(1);
  });

  test('does not inject the listeners if the form modal is open', () => {
    renderSortableItem({ isFormModalOpen: true });

    const item = screen.getByTestId('schema-form-collection-item');

    expect(useSortable).toHaveBeenCalledTimes(1);
    expect(useSortable).toHaveBeenCalledWith({ id: 1 });

    userEvent.type(item, 'a');

    expect(listeners.onKeyDown).not.toHaveBeenCalled();
  });
});
