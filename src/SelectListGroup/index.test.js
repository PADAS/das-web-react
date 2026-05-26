import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../test-utils';

import SelectListGroup from './';

describe('SelectListGroup', () => {
  const onChange = jest.fn();

  const defaultOptions = [
    {
      description: 'African',
      label: 'Buffalo',
      value: 'buffalo_african',
    },
    {
      description: 'American',
      label: 'Buffalo',
      value: 'buffalo_american',
    },
    {
      label: 'Lion',
      value: 'lion',
    },
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderSelectListGroup = (props) => render(
    <SelectListGroup
      id="species-field"
      invalid={false}
      label="Animal Species"
      onChange={onChange}
      options={defaultOptions}
      value={[]}
      {...props}
    />,
  );

  test('shows the multi-select list group fieldset', () => {
    renderSelectListGroup();

    const group = screen.getByRole('group', { name: 'Animal Species' });

    expect(group).toBeVisible();
    expect(group).toHaveClass('fieldset');
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  test('shows the single-select list group fieldset', () => {
    renderSelectListGroup({ isMulti: false, value: 'lion' });

    const group = screen.getByRole('group', { name: 'Animal Species' });

    expect(group).toBeVisible();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  test('shows an invalid select list group', () => {
    renderSelectListGroup({ invalid: true });

    expect(screen.getByRole('group', { name: 'Animal Species' })).toHaveClass('error');
  });

  test('shows a read-only select list group', () => {
    renderSelectListGroup({ readOnly: true });

    expect(screen.getByRole('group', { name: 'Animal Species' })).toHaveClass('readOnly');
  });

  test('shows a disabled select list group', () => {
    renderSelectListGroup({ disabled: true });

    const group = screen.getByRole('group', { name: 'Animal Species' });

    expect(group).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /Buffalo.*African/i })).toBeDisabled();
  });

  test('shows the label of the select list group as the fieldset legend', () => {
    renderSelectListGroup();

    const group = screen.getByRole('group', { name: 'Animal Species' });

    expect(within(group).getByText('Animal Species')).toBeVisible();
  });

  test('shows the selectable items of the select list group', () => {
    renderSelectListGroup();

    expect(screen.getByRole('checkbox', { name: /Buffalo.*African/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Buffalo.*American/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Lion' })).toBeInTheDocument();
  });

  test('shows a required multi-select list group', () => {
    renderSelectListGroup({ 'aria-required': true });

    expect(screen.getByRole('checkbox', { name: /Buffalo.*African/i })).toHaveAttribute('aria-required', 'true');
  });

  test('shows a required single-select list group', () => {
    renderSelectListGroup({ isMulti: false, value: 'lion', 'aria-required': true });

    const radios = screen.getAllByRole('radio');

    expect(radios[0]).toHaveAttribute('aria-required', 'true');
    expect(radios[1]).not.toHaveAttribute('aria-required');
    expect(radios[2]).not.toHaveAttribute('aria-required');
  });

  test('changes the value of the select list group when the user selects an option for a multi-select list group', async () => {
    const user = userEvent.setup();
    renderSelectListGroup({ value: ['buffalo_african'] });

    await user.click(screen.getByRole('checkbox', { name: 'Lion' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['buffalo_african', 'lion']);
  });

  test('changes the value of the select list group when the user selects an option for a single-select list group', async () => {
    const user = userEvent.setup();
    renderSelectListGroup({ isMulti: false, value: 'lion' });

    await user.click(screen.getByRole('radio', { name: /Buffalo.*African/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('buffalo_african');
  });
});
