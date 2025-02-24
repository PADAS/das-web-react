import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';

import SelectListGroup from './';

describe('SelectListGroup', () => {
  const options = [
    {
      label: 'An option',
      value: 124
    },
    {
      label: 'The option',
      value: 32409
    },
    {
      label: 'Option',
      value: 1340
    },
  ];
  const initialProps = {
    disabled: false,
    getOptionLabel: null,
    getOptionValue: null,
    id: 'A select list',
    isMulti: true,
    options,
    onChange: () => {},
    readOnly: false,
    value: null,
    label: 'A selectable group',
    invalid: false,
  };

  const renderSelectListGroup = (props = initialProps) => render(
    <SelectListGroup {...props} />
  );

  test('shows a proper list of checkboxes', () => {
    renderSelectListGroup();

    options.forEach((option) => {
      const input = screen.getByLabelText(option.label);
      expect( screen.getByText(option.label) ).toBeVisible();
      expect( input ).toBeInTheDocument();
      expect( input.type ).toBe('checkbox');
    });
  });

  test('shows a proper list of radio buttons', () => {
    renderSelectListGroup({
      ...initialProps,
      isMulti: false
    });

    options.forEach((option) => {
      const input = screen.getByLabelText(option.label);
      expect( screen.getByText(option.label) ).toBeVisible();
      expect( input ).toBeInTheDocument();
      expect( input.type ).toBe('radio');
    });
  });

  test('allows to select multiple options', () => {
    const onChange = jest.fn();

    renderSelectListGroup({
      ...initialProps,
      value: [124],
      onChange
    });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.click( screen.getByText('The option') );

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([124, 32409]);
  });

  test('allows to select only one option', () => {
    const onChange = jest.fn();

    renderSelectListGroup({
      ...initialProps,
      value: 124,
      isMulti: false,
      onChange
    });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.click( screen.getByText('The option') );

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(32409);
  });

  test('shows a proper selectable item with custom option object', () => {
    const options = [
      {
        title: 'A custom product',
        price: 150
      }
    ];
    renderSelectListGroup({
      ...initialProps,
      options,
      getOptionLabel: (option) => option.title,
      getOptionValue: (option) => option.price
    });

    expect( screen.getByText('A custom product') ).toBeVisible();
  });

  test('shows a disabled list of checkboxes', () => {
    renderSelectListGroup({
      ...initialProps,
      disabled: true
    });

    expect(screen.getByRole('group')).toBeDisabled();

    options.forEach((option) => {
      const input = screen.getByLabelText(option.label);
      expect( screen.getByText(option.label) ).toBeVisible();
      expect( input ).toBeInTheDocument();
      expect( input.type ).toBe('checkbox');
      expect( input ).toBeDisabled();
    });
  });

  test('shows a disabled list of radios', () => {
    renderSelectListGroup({
      ...initialProps,
      disabled: true,
      isMulti: false,
    });

    expect(screen.getByRole('group')).toBeDisabled();

    options.forEach((option) => {
      const input = screen.getByLabelText(option.label);
      expect( screen.getByText(option.label) ).toBeVisible();
      expect( input ).toBeInTheDocument();
      expect( input.type ).toBe('radio');
      expect( input ).toBeDisabled();
    });
  });

  test('shows an invalid list', () => {
    renderSelectListGroup({
      ...initialProps,
      invalid: true,
    });

    expect(screen.getByRole('group')).toHaveClass('error');
  });

});
