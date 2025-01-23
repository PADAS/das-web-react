import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen, waitFor } from '../../../../../../test-utils';
import { FORM_ELEMENT_TYPES } from '../../../constants';

import Item from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Collection - Item', () => {
  const onChange = jest.fn();
  const onDelete = jest.fn();
  const renderField = jest.fn();

  const renderItem = (props) => render(<Item
    breadcrumbs={[{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }]}
    columns={1}
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
    identifier="field-1"
    index={1}
    leftColumn={['field-1', 'field-2']}
    name="Collection 1"
    onChange={onChange}
    onDelete={onDelete}
    renderField={renderField}
    rightColumn={[]}
    {...props}
  />);

  test('shows an error state in the item if the children have errors', () => {
    renderItem({ errors: { 'field-1': { message: 'Error' } } });

    expect(screen.getByTestId('schema-form-collection-item')).toHaveClass('error');
  });

  test('does not show an error state in the item', () => {
    renderItem();

    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveClass('error');
  });

  test('sets a default title with the collection name and its index if there is no identifier', () => {
    renderItem({ identifier: undefined });

    expect(screen.getByText('Collection 1 - 2')).toBeVisible();
  });

  test('sets a default title with the collection name and its index if the identifier field does not have a value', () => {
    renderItem({ formData: { 'field-1': '', 'field-2': 'Value 2' } });

    expect(screen.getByText('Collection 1 - 2')).toBeVisible();
  });

  test('sets the identifier field value as the title', () => {
    renderItem();

    const title = screen.getAllByText('Value 1')[0];

    expect(title).toBeVisible();
    expect(title).toHaveClass('title');
  });

  test('opens the form preview when user clicks the chevron', () => {
    renderItem();

    const chevronButton = screen.getByLabelText('Open the Value 1 form preview');

    expect(chevronButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveClass('open');

    userEvent.click(chevronButton);

    expect(chevronButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('schema-form-collection-item')).toHaveClass('open');
  });

  test('closes the form preview when user clicks the chevron again', () => {
    renderItem();

    const chevronButton = screen.getByLabelText('Open the Value 1 form preview');

    userEvent.click(chevronButton);

    expect(chevronButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('schema-form-collection-item')).toHaveClass('open');

    userEvent.click(chevronButton);

    expect(chevronButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveClass('open');
  });

  test('opens the form modal when user clicks the edit button', () => {
    renderItem();

    expect(screen.queryByRole('dialog')).toBeNull();

    userEvent.click(screen.getByLabelText('Edit Value 1'));

    expect(screen.getByRole('dialog')).toBeVisible();
  });

  test('changes the content of a child field and clears its error in the form modal', () => {
    renderField.mockImplementation((id, value, onChange) => <input
      data-testid={id}
      onChange={(event) => onChange(id, event.target.value)}
      value={value}
    />);
    renderItem({ errors: { 'field-1': { message: 'Error' }, 'field-2': { message: 'Error' } } });

    userEvent.click(screen.getByLabelText('Edit Value 1'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByTestId('field-1'), 'a');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      { 'field-1': 'Value 1a', 'field-2': 'Value 2' },
      { 'field-2': { message: 'Error' } }
    );
  });

  test('resets the initial values of the form and closes the form modal after editing it if the user clicks Cancel', async () => {
    const { rerender } = renderItem();

    userEvent.click(screen.getByLabelText('Edit Value 1'));

    rerender(<Item
      breadcrumbs={[{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }]}
      columns={1}
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
      formData={{ 'field-1': 'New value 1', 'field-2': 'Value 2' }}
      identifier="field-1"
      index={1}
      leftColumn={['field-1', 'field-2']}
      name="Collection 1"
      onChange={onChange}
      onDelete={onDelete}
      renderField={renderField}
      rightColumn={[]}
    />);

    const formModal = screen.getByRole('dialog');

    expect(onChange).not.toHaveBeenCalled();
    expect(formModal).toBeVisible();

    userEvent.click(screen.getByText('Cancel'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ 'field-1': 'Value 1', 'field-2': 'Value 2' }, undefined);
    await waitFor(() => {
      expect(formModal).not.toBeVisible();
    });
  });

  test('deletes the item and closes the form modal when the user clicks the trash button in the modal', async () => {
    renderItem();

    userEvent.click(screen.getByLabelText('Edit Value 1'));

    const formModal = screen.getByRole('dialog');

    expect(onDelete).not.toHaveBeenCalled();
    expect(formModal).toBeVisible();

    userEvent.click(screen.getByLabelText('Delete Value 1'));

    expect(onDelete).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(formModal).not.toBeVisible();
    });
  });
});
