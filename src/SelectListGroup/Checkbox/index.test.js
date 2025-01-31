import React from 'react';
import { render, screen } from '../../test-utils';

import Checkbox from './index';
import userEvent from '@testing-library/user-event';

describe('SelectListGroup - Checkbox', () => {

  const defaultProps = {
    disabled: false,
    isChecked: true,
    label: 'This is a checkbox',
    onChange: () => {},
    readOnly: false,
    value: 110,
  };

  const renderCheckbox = (props = defaultProps) => render(
    <Checkbox {...props} />
  );

  const testCheckboxHasChangedWithClick = (queryClickableElement, expectedIsChecked, initialIsChecked = true) => {
    const onChange = jest.fn();
    renderCheckbox({
      ...defaultProps,
      isChecked: initialIsChecked,
      onChange
    });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.click(queryClickableElement());

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(110, expectedIsChecked, 'checkBox-110');
  };

  const testCheckboxHasChangedUsingKeyboard = (keyboardKey, expectedIsChecked, initialIsChecked = true) => {
    const onChange = jest.fn();
    renderCheckbox({
      ...defaultProps,
      isChecked: initialIsChecked,
      onChange
    });

    expect(onChange).not.toHaveBeenCalled();

    const checkbox = screen.getAllByRole('checkbox')[0]; // points to the div container

    checkbox.focus();
    userEvent.keyboard(keyboardKey);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(110, expectedIsChecked, 'checkBox-110');
  };

  test('shows a proper label', () => {
    renderCheckbox();

    expect( screen.getByLabelText('This is a checkbox') ).toBeVisible();
  });

  test('shows a checked checkbox', () => {
    renderCheckbox({
      ...defaultProps,
      name: 'checkboxName'
    });

    const checkbox = screen.getByRole('checkbox', { name: 'This is a checkbox' });
    const checkboxIcon = screen.getByRole('img');

    expect( checkbox ).toBeChecked();
    expect( checkboxIcon ).toBeVisible();
  });

  test('the checkbox is unchecked when user clicks on label', () => {
    testCheckboxHasChangedWithClick(
      () => screen.getByLabelText('This is a checkbox'),
      false
    );
  });

  test('the checkbox is checked when user clicks on label', () => {
    testCheckboxHasChangedWithClick(
      () => screen.getByLabelText('This is a checkbox'),
      true,
      false
    );
  });

  test('the checkbox is unchecked when user clicks on checkbox icon', () => {
    testCheckboxHasChangedWithClick(
      () => screen.getByRole('img'),
      false
    );
  });

  test('the checkbox is checked when user clicks on checkbox icon', () => {
    testCheckboxHasChangedWithClick(
      () => screen.getByRole('img'),
      true,
      false
    );
  });

  test('the checkbox is unchecked when user focus item and hits Enter', () => {
    testCheckboxHasChangedUsingKeyboard(
      '[Enter]',
      false
    );
  });

  test('the checkbox is checked when user focus item and hits Enter', () => {
    testCheckboxHasChangedUsingKeyboard(
      '[Enter]',
      true,
      false
    );
  });

  test('the checkbox is unchecked when user focus item and hits space bar', () => {
    testCheckboxHasChangedUsingKeyboard(
      '[Space]',
      false
    );
  });

  test('the checkbox is checked when user focus item and types  space bar', () => {
    testCheckboxHasChangedUsingKeyboard(
      '[Space]',
      true,
      false
    );
  });

});
