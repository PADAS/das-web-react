import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../../test-utils';

import SelectableItem from './';

describe('SelectListGroup - SelectableItem', () => {
  const onClick = jest.fn();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderSelectableItem = (props) => render(
    <SelectableItem
      groupId="species-field"
      id="buffalo_african"
      invalid={false}
      isChecked={false}
      label="Buffalo"
      onClick={onClick}
      readOnly={false}
      ref={null}
      value="buffalo_african"
      {...props}
    />,
  );

  test('shows a multi-select selectable item', () => {
    renderSelectableItem();

    const wrapper = screen.getByTestId('selectable-item-buffalo_african');
    const input = screen.getByRole('checkbox', { name: 'Buffalo' });
    const label = screen.getByText('Buffalo').closest('label');

    expect(input).toBeVisible();
    expect(input).toHaveAttribute('type', 'checkbox');
    expect(input).toHaveAttribute('id', 'buffalo_african');
    expect(input).toHaveAttribute('name', 'buffalo_african');
    expect(input).not.toHaveAttribute('value');
    expect(input).not.toBeChecked();
    expect(input).toBe(screen.getByTestId('input-for-Buffalo'));

    expect(label).toHaveAttribute('for', 'buffalo_african');
    expect(label).not.toHaveClass('error');

    expect(wrapper).toHaveClass('selectableItem');
    expect(wrapper).not.toHaveClass('inactive');
    expect(wrapper.firstElementChild).toHaveClass('ripple');
    expect(within(wrapper).getByRole('checkbox')).toBe(input);

    expect(screen.queryByTitle('African')).not.toBeInTheDocument();
  });

  test('shows a single-select selectable item', () => {
    renderSelectableItem({ isMulti: false });

    const wrapper = screen.getByTestId('selectable-item-buffalo_african');
    const input = screen.getByRole('radio', { name: 'Buffalo' });
    const label = screen.getByText('Buffalo').closest('label');

    expect(input).toBeVisible();
    expect(input).toHaveAttribute('type', 'radio');
    expect(input).toHaveAttribute('id', 'buffalo_african');
    expect(input).toHaveAttribute('name', 'species-field-option');
    expect(input).toHaveAttribute('value', 'buffalo_african');
    expect(input).not.toBeChecked();
    expect(input).toBe(screen.getByTestId('input-for-Buffalo'));

    expect(label).toHaveAttribute('for', 'buffalo_african');
    expect(label).not.toHaveClass('error');

    expect(wrapper).toHaveClass('selectableItem');
    expect(wrapper.firstElementChild).toHaveClass('ripple');
  });

  test('shows a disabled selectable item', async () => {
    const user = userEvent.setup();
    renderSelectableItem({ disabled: true });

    const input = screen.getByRole('checkbox', { name: 'Buffalo' });
    const wrapper = screen.getByTestId('selectable-item-buffalo_african');

    expect(input).toBeDisabled();
    expect(input).not.toHaveAttribute('readonly');
    expect(wrapper).toHaveClass('inactive');

    await user.click(input);

    expect(onClick).not.toHaveBeenCalled();
  });

  test('shows a read-only selectable item', async () => {
    const user = userEvent.setup();
    renderSelectableItem({ readOnly: true });

    const input = screen.getByRole('checkbox', { name: 'Buffalo' });
    const wrapper = screen.getByTestId('selectable-item-buffalo_african');

    expect(input).not.toBeDisabled();
    expect(input).toHaveAttribute('readonly');
    expect(wrapper).toHaveClass('inactive');

    await user.click(input);

    expect(onClick).not.toHaveBeenCalled();
  });

  test('shows a checked selectable item', () => {
    renderSelectableItem({ isChecked: true });

    const input = screen.getByRole('checkbox', { name: 'Buffalo' });

    expect(input).toHaveAttribute('type', 'checkbox');
    expect(input).toBeChecked();
  });

  test('shows an invalid selectable item', () => {
    renderSelectableItem({ invalid: true });

    expect(screen.getByText('Buffalo').closest('label')).toHaveClass('error');
  });

  test('shows the label of the selectable item', () => {
    renderSelectableItem();

    const input = screen.getByRole('checkbox', { name: 'Buffalo' });
    const display = screen.getByTitle('Buffalo');

    expect(input).toBeInTheDocument();
    expect(display).toHaveTextContent('Buffalo');
    expect(display).toHaveClass('display');
  });

  test('shows a description of the selectable item', () => {
    renderSelectableItem({ description: 'African' });

    const input = screen.getByRole('checkbox', { name: /Buffalo.*African/i });
    const description = screen.getByTitle('African');

    expect(input).toBeInTheDocument();
    expect(description).toHaveTextContent('African');
    expect(description).toHaveClass('description');
  });

  test('does not render a description span when description is omitted', () => {
    renderSelectableItem();

    expect(screen.queryByRole('checkbox', { name: /Buffalo.*African/i })).not.toBeInTheDocument();
    expect(document.querySelector('.description')).toBeNull();
  });

  test('merges className onto the wrapper', () => {
    renderSelectableItem({ className: 'custom-row' });

    expect(screen.getByTestId('selectable-item-buffalo_african')).toHaveClass('selectableItem', 'custom-row');
  });

  test('forwards ref to the input element', () => {
    const ref = React.createRef();
    renderSelectableItem({ ref });

    expect(ref.current).toBe(screen.getByRole('checkbox', { name: 'Buffalo' }));
  });

  test('spreads additional props onto the input', () => {
    renderSelectableItem({ 'aria-required': 'true' });

    expect(screen.getByRole('checkbox', { name: 'Buffalo' })).toHaveAttribute('aria-required', 'true');
  });

  test('calls the onClick callback when the user selects an unchecked item', async () => {
    const user = userEvent.setup();
    renderSelectableItem();

    await user.click(screen.getByRole('checkbox', { name: 'Buffalo' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith('buffalo_african', true);
  });

  test('calls the onClick callback when the user clears a checked item', async () => {
    const user = userEvent.setup();
    renderSelectableItem({ isChecked: true });

    await user.click(screen.getByRole('checkbox', { name: 'Buffalo' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith('buffalo_african', false);
  });
});
