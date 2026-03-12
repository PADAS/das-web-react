import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../../test-utils';

import Boolean from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Boolean', () => {
  const onFieldChange = jest.fn();

  let details;
  beforeEach(() => {
    details = {
      defaultInput: true,
      description: 'Boolean 1 Description',
      isRequired: false,
      label: 'Boolean 1 Label',
      value: 'boolean-1',
    };
  });

  const renderBooleanField = (props) => render(<Boolean
    details={details}
    error={undefined}
    id="boolean-1"
    onFieldChange={onFieldChange}
    value={undefined}
    {...props}
  />);

  test('shows a non read only boolean field', () => {
    renderBooleanField();

    expect(screen.getByRole('switch', { name: 'Boolean 1 Label' })).not.toHaveAttribute('readonly');
  });

  test('shows a read only boolean field', () => {
    renderBooleanField({ readOnly: true });

    expect(screen.getByRole('switch', { name: 'Boolean 1 Label' })).toHaveAttribute('readonly');
  });

  test('shows a non required boolean field', () => {
    renderBooleanField();

    expect(screen.getByRole('switch', { name: 'Boolean 1 Label' })).not.toBeRequired();
  });

  test('shows a required boolean field', () => {
    details.isRequired = true;
    renderBooleanField();

    expect(screen.getByRole('switch', { name: 'Boolean 1 Label' })).toBeRequired();
  });

  test('does not show an error state in the label if the value is valid', () => {
    renderBooleanField();

    expect(screen.getByText('Boolean 1 Label')).not.toHaveClass('error');
  });

  test('shows an error state in the label if the value is invalid', () => {
    renderBooleanField({ error: { message: 'Error' } });

    expect(screen.getByText('Boolean 1 Label')).toHaveClass('error');
  });

  test('does not show the description', () => {
    details.description = '';
    renderBooleanField();

    expect(screen.getByRole('switch', { name: 'Boolean 1 Label' })).not.toHaveAccessibleDescription();
  });

  test('shows the description', () => {
    renderBooleanField();

    const description = screen.getByRole('paragraph');

    expect(description).not.toHaveClass('error');
    expect(description).toHaveTextContent('Boolean 1 Description');
    expect(screen.getByRole('switch', { name: 'Boolean 1 Label' })).toHaveAccessibleDescription('Boolean 1 Description');
  });

  test('shows a valid input when there are no errors', () => {
    renderBooleanField();

    const switchInput = screen.getByRole('switch', { name: 'Boolean 1 Label' });

    expect(switchInput).toBeValid();
    expect(switchInput).not.toHaveAccessibleErrorMessage();
  });

  test('shows an invalid input when there are errors', () => {
    renderBooleanField({ error: { message: 'Error' } });

    const switchInput = screen.getByRole('switch', { name: 'Boolean 1 Label' });
    const description = screen.getByRole('paragraph');

    expect(switchInput).toBeInvalid();
    expect(switchInput).toHaveAccessibleErrorMessage('Error');
    expect(description).toHaveClass('error');
    expect(description).toHaveTextContent('Error');
  });

  test('updates the form data when the user does changes to the input', async () => {
    details.defaultInput = false;
    renderBooleanField();

    await userEvent.click(screen.getByRole('switch', { name: 'Boolean 1 Label' }));

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('boolean-1', true);
  });
});
