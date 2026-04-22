import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../../../../../test-utils';
import { mockStore } from '../../../../../../../../__test-helpers/MockStore';

import FormModal from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Collection - SortableList - Item - FormModal', () => {
  const focusLocationMarker = jest.fn();
  const onCancel = jest.fn();
  const onDeleteItem = jest.fn();
  const onDone = jest.fn();
  const onFieldChange = jest.fn();
  const renderFormElement = jest.fn();

  let store;
  beforeEach(() => {
    store = {
      view: {
        modals: {
          canShowModals: true,
        },
      },
    };
  });

  const renderFormModal = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <FormModal
        breadcrumbs={[{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }]}
        columns={1}
        errors={{}}
        focusLocationMarker={focusLocationMarker}
        formData={{ 'field-1': 'Value 1', 'field-2': 'Value 2' }}
        isOpen
        itemName="Item"
        leftColumn={['collection-1.field-1', 'collection-1.field-2']}
        onCancel={onCancel}
        onDeleteItem={onDeleteItem}
        onDone={onDone}
        onFieldChange={onFieldChange}
        renderFormElement={renderFormElement}
        rightColumn={[]}
        title="Item 3"
        hideDeleteButton={false}
        {...props}
      />
    </Provider>
  );

  test('shows the modal', async () => {
    renderFormModal({ breadcrumbs: [] });

    expect(screen.getByLabelText('Item')).not.toHaveClass('noBackground');
    expect(screen.getByLabelText('Item')).not.toHaveClass('hide');
  });

  test('does not show the modal background if it is nested', async () => {
    renderFormModal();

    expect(screen.getByLabelText('Item')).toHaveClass('noBackground');
  });

  test('hides the modal if they are disabled by the modals reducer', async () => {
    store.view.modals.canShowModals = false;
    renderFormModal();

    expect(screen.getByLabelText('Item')).toHaveClass('hide');
  });

  test('shows the breadcrumbs', async () => {
    renderFormModal();

    const breadcrumbs = screen.getByLabelText('breadcrumb');

    expect(breadcrumbs).toBeVisible();
    expect(breadcrumbs).toHaveTextContent('Item 1Item 2Item 3');
  });

  test('shows the left column when it is the only column', async () => {
    renderFormModal();

    const leftColumn = screen.getByTestId('schema-form-collection-form-modal-left-column');

    expect(leftColumn).toBeVisible();
    expect(leftColumn).toHaveClass('fullWidth');
  });

  test('shows the left column when there are two columns', async () => {
    renderFormModal({ columns: 2 });

    const leftColumn = screen.getByTestId('schema-form-collection-form-modal-left-column');

    expect(leftColumn).toBeVisible();
    expect(leftColumn).toHaveClass('halfWidthLeft');
  });

  test('does not show the right column if the section has one column', async () => {
    renderFormModal();

    expect(screen.queryByTestId('schema-form-collection-form-modal-right-column')).toBeNull();
  });

  test('shows the right column if the section has two columns', async () => {
    renderFormModal({ columns: 2 });

    expect(screen.getByTestId('schema-form-collection-form-modal-right-column')).toBeVisible();
  });

  test('renders the children', async () => {
    renderFormModal();

    expect(renderFormElement).toHaveBeenCalledTimes(2);
    expect(renderFormElement).toHaveBeenCalledWith(
      'collection-1.field-1',
      'Value 1',
      onFieldChange,
      undefined,
      focusLocationMarker,
      [{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }, { id: 'collection-1.field-1', display: 'Item 3' }]
    );
    expect(renderFormElement).toHaveBeenCalledWith(
      'collection-1.field-2',
      'Value 2',
      onFieldChange,
      undefined,
      focusLocationMarker,
      [{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }, { id: 'collection-1.field-2', display: 'Item 3' }]
    );
  });

  test('deletes the item when user clicks the trash icon', async () => {
    renderFormModal();

    expect(onDeleteItem).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByLabelText('Delete Item 3'));

    expect(onDeleteItem).toHaveBeenCalledTimes(1);
  });

  test('hides trash icon based on hideDeleteButton prop', async () => {
    renderFormModal({ hideDeleteButton: true });

    expect(screen.queryByLabelText('Delete Item 3')).not.toBeInTheDocument();
  });

  test('disables the trash icon if the collection is read only', async () => {
    renderFormModal({ readOnly: true });

    expect(screen.getByLabelText('Delete Item 3')).toBeDisabled();
  });

  test('cancels the edition of the form when user clicks Cancel', async () => {
    renderFormModal();

    expect(onCancel).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('finishes the edition of the form when user clicks Done', async () => {
    renderFormModal();

    expect(onDone).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByText('Done'));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
