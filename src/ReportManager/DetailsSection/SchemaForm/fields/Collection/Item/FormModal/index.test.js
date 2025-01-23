import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../../../../test-utils';

import FormModal from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Collection - Item - FormModal', () => {
  const onCancel = jest.fn();
  const onDeleteItem = jest.fn();
  const onDone = jest.fn();
  const onFieldChange = jest.fn();
  const renderField = jest.fn();

  const renderFormModal = (props) => render(<FormModal
    breadcrumbs={[{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }]}
    columns={1}
    errors={{}}
    formData={{ 'field-1': 'Value 1', 'field-2': 'Value 2' }}
    isOpen
    leftColumn={['field-1', 'field-2']}
    onCancel={onCancel}
    onDeleteItem={onDeleteItem}
    onDone={onDone}
    onFieldChange={onFieldChange}
    renderField={renderField}
    rightColumn={[]}
    title="Item 3"
    {...props}
  />);

  test('shows the breadcrumb if we are in a second level collection', () => {
    renderFormModal();

    const breadcrumbs = screen.getByLabelText('breadcrumb');

    expect(breadcrumbs).toBeVisible();
    expect(breadcrumbs).toHaveTextContent('Item 1Item 2Item 3');
  });

  test('does not show the breadcrumb if we are in a first level collection', () => {
    renderFormModal({ breadcrumbs: [] });

    expect(screen.queryByLabelText('breadcrumb')).toBeNull();
  });

  test('shows the left column when it is the only column', () => {
    renderFormModal();

    const leftColumn = screen.getByTestId('schema-form-collection-form-modal-left-column');

    expect(leftColumn).toBeVisible();
    expect(leftColumn).toHaveClass('fullWidth');
  });

  test('shows the left column when there are two columns', () => {
    renderFormModal({ columns: 2 });

    const leftColumn = screen.getByTestId('schema-form-collection-form-modal-left-column');

    expect(leftColumn).toBeVisible();
    expect(leftColumn).toHaveClass('halfWidthLeft');
  });

  test('does not show the right column if the section has one column', () => {
    renderFormModal();

    expect(screen.queryByTestId('schema-form-collection-form-modal-right-column')).toBeNull();
  });

  test('shows the right column if the section has two columns', () => {
    renderFormModal({ columns: 2 });

    expect(screen.getByTestId('schema-form-collection-form-modal-right-column')).toBeVisible();
  });

  test('renders the children', () => {
    renderFormModal();

    expect(renderField).toHaveBeenCalledTimes(2);
    expect(renderField).toHaveBeenCalledWith(
      'field-1',
      'Value 1',
      onFieldChange,
      undefined,
      [{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }, { id: 'field-1', display: 'Item 3' }]
    );
    expect(renderField).toHaveBeenCalledWith(
      'field-2',
      'Value 2',
      onFieldChange,
      undefined,
      [{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }, { id: 'field-2', display: 'Item 3' }]
    );
  });

  test('deletes the item when user clicks the trash icon', () => {
    renderFormModal();

    expect(onDeleteItem).toHaveBeenCalledTimes(0);

    userEvent.click(screen.getByLabelText('Delete Item 3'));

    expect(onDeleteItem).toHaveBeenCalledTimes(1);
  });

  test('cancels the edition of the form when user clicks Cancel', () => {
    renderFormModal();

    expect(onCancel).toHaveBeenCalledTimes(0);

    userEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('finishes the edition of the form when user clicks Done', () => {
    renderFormModal();

    expect(onDone).toHaveBeenCalledTimes(0);

    userEvent.click(screen.getByText('Done'));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
