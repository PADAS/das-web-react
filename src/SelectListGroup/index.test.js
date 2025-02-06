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
    value: null
  };

  const renderSelectListGroup = (props = initialProps) => render(
    <SelectListGroup {...props} />
  );

  test('shows a proper list of checkboxes', () => {
    renderSelectListGroup();

    options.forEach((option) => {
      expect( screen.getByText(option.label) ).toBeVisible();
      expect( screen.getByRole('checkbox', { name: option.label }) ).toBeInTheDocument();
    });
  });

  test('shows a proper list of radio buttons', () => {
    renderSelectListGroup({
      ...initialProps,
      isMulti: false
    });

    options.forEach((option) => {
      const [, input] = screen.getAllByRole('radio', { name: option.label });
      expect( screen.getByText(option.label) ).toBeVisible();
      expect( input ).toBeInTheDocument();
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

});
