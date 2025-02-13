import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';

import SelectableItem from './';

describe('SelectListGroup - SelectableItem', () => {

  const defaultProps = {
    disabled: false,
    isChecked: true,
    id: 'item-123',
    label: 'This is a checkbox',
    onClick: () => {},
    readOnly: false,
    value: 110,
    isMulti: true,

    hasError: false,
    focusNextSelectableItem: null,
    focusPreviousSelectableItem: null,
    groupId: 'selectable-group-id',
    isFocused: false,
    setIsFocused: () => {},
  };

  const renderSelectableItem = (props = defaultProps) => render(
    <SelectableItem {...props} />
  );

  const testSelectableItemHasChangedWithClick = (queryClickableElement, expectedIsChecked, props = {}) => {
    const onClick = jest.fn();
    renderSelectableItem({
      ...defaultProps,
      ...props,
      onClick,
    });


    screen.debug(undefined, 9999999);

    expect(onClick).not.toHaveBeenCalled();

    const element = queryClickableElement();

    userEvent.click(element);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(110, expectedIsChecked);
  };

  const testSelectableItemHasChangedUsingKeyboard = (keyboardKey, expectedIsChecked, props = {}) => {
    const onClick = jest.fn();
    const itemProps = {
      ...defaultProps,
      ...props
    };
    const role = itemProps.isMulti ? 'checkbox' : 'radio';

    renderSelectableItem({
      ...itemProps,
      onClick
    });

    expect(onClick).not.toHaveBeenCalled();

    const input = screen.getByRole(role);

    input.focus();
    userEvent.keyboard(keyboardKey);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(110, expectedIsChecked);
  };

  test('shows a proper label', () => {
    renderSelectableItem();

    expect( screen.getByText('This is a checkbox') ).toBeVisible();
  });

  describe('Checkbox item', () => {

    test('shows a checked checkbox', () => {
      renderSelectableItem();

      const checkbox = screen.getByRole('checkbox');
      const checkboxIcon = screen.getByTestId('selectable-item-icon-item-123');

      expect( checkbox ).toBeChecked();
      expect( checkboxIcon ).toHaveClass('checked');
    });

    test('shows an unchecked checkbox', () => {
      renderSelectableItem({
        ...defaultProps,
        isChecked: false
      });

      const checkbox = screen.getByRole('checkbox');
      const checkboxIcon = screen.getByTestId('selectable-item-icon-item-123');

      expect( checkbox ).not.toBeChecked();
      expect( checkboxIcon ).not.toHaveClass('checked');
    });

    test('the checkbox is unchecked when user clicks on label', () => {
      testSelectableItemHasChangedWithClick(
        () => screen.getByText('This is a checkbox'),
        false
      );
    });

    test('the checkbox is checked when user clicks on label', () => {
      testSelectableItemHasChangedWithClick(
        () => screen.getByText('This is a checkbox'),
        true,
        {
          isChecked: false
        }
      );
    });

    test('the checkbox is unchecked when user clicks on checkbox icon', () => {
      testSelectableItemHasChangedWithClick(
        () => screen.getByRole('img'),
        false
      );
    });

    test('the checkbox is checked when user clicks on checkbox icon', () => {
      testSelectableItemHasChangedWithClick(
        () => screen.getByRole('img'),
        true,
        {
          isChecked: false
        }
      );
    });

    test('the checkbox is unchecked when user focus item and hits Enter', () => {
      testSelectableItemHasChangedUsingKeyboard(
        '[Enter]',
        false
      );
    });

    test('the checkbox is checked when user focus item and hits Enter', () => {
      testSelectableItemHasChangedUsingKeyboard(
        '[Enter]',
        true,
        {
          isChecked: false
        }
      );
    });

    test('the checkbox is unchecked when user focus item and hits space bar', () => {
      testSelectableItemHasChangedUsingKeyboard(
        '[Space]',
        false
      );
    });

    test('the checkbox is checked when user focus item and types  space bar', () => {
      testSelectableItemHasChangedUsingKeyboard(
        '[Space]',
        true,
        {
          isChecked: false
        }
      );
    });

    test('checkbox is disabled', () => {
      const onClick = jest.fn();
      renderSelectableItem({
        ...defaultProps,
        onClick,
        disabled: true,
      });

      expect(onClick).not.toHaveBeenCalled();

      const input = screen.getByRole('checkbox');

      userEvent.click(input);

      expect(input).toBeDisabled();
      expect(onClick).not.toHaveBeenCalled();
    });

    test('checkbox is readOnly', () => {
      const onClick = jest.fn();
      renderSelectableItem({
        ...defaultProps,
        onClick,
        readOnly: true,
      });

      expect(onClick).not.toHaveBeenCalled();

      const input = screen.getByRole('checkbox');

      userEvent.click(input);

      expect(input).toHaveProperty('readOnly', true);
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Radio item', () => {

    test('shows a checked radio', () => {
      renderSelectableItem({
        ...defaultProps,
        label: 'This is a radio',
        isMulti: false
      });

      const radio = screen.getByRole('radio');
      const radioIcon = screen.getByTestId('selectable-item-icon-item-123');

      expect( radio ).toBeChecked();
      expect( radioIcon ).toHaveClass('checked');
    });

    test('shows an unchecked radio', () => {
      renderSelectableItem({
        ...defaultProps,
        label: 'This is a radio',
        isChecked: false,
        isMulti: false
      });

      const radio = screen.getByRole('radio');
      const radioIcon = screen.getByTestId('selectable-item-icon-item-123');

      expect( radio ).not.toBeChecked();
      expect( radioIcon ).not.toHaveClass('checked');
    });

    test.only('the radio is unchecked when user clicks on label', () => {
      testSelectableItemHasChangedWithClick(
        () => screen.getByText('This is a radio'),
        false,
        {
          label: 'This is a radio',
          isMulti: false,
        }
      );
    });

    test('the radio is checked when user clicks on label', () => {
      testSelectableItemHasChangedWithClick(
        () => screen.getByTestId('selectable-item-icon-item-123'),
        true,
        {
          label: 'This is a radio',
          isMulti: false,
          isChecked: false,
        },
      );
    });

    test('the radio is unchecked when user clicks on checkbox icon', () => {
      testSelectableItemHasChangedWithClick(
        () => screen.getByTestId('selectable-item-icon-item-123'),
        false,
        {
          isMulti: false,
        },
      );
    });

    test('the radio is checked when user clicks on checkbox icon', () => {
      testSelectableItemHasChangedWithClick(
        () => screen.getByTestId('selectable-item-icon-item-123'),
        true,
        {
          isMulti: false,
          isChecked: false,
        },
      );
    });

    test('the radio is unchecked when user focus item and hits Enter', () => {
      testSelectableItemHasChangedUsingKeyboard(
        '[Enter]',
        false
      );
    });

    test('the radio is checked when user focus item and hits Enter', () => {
      testSelectableItemHasChangedUsingKeyboard(
        '[Enter]',
        true,
        {
          isMulti: false,
          isChecked: false,
        }
      );
    });

    test('the radio is unchecked when user focus item and hits space bar', () => {
      testSelectableItemHasChangedUsingKeyboard(
        '[Space]',
        false
      );
    });

    test('the radio is checked when user focus item and types  space bar', () => {
      testSelectableItemHasChangedUsingKeyboard(
        '[Space]',
        true,
        {
          isMulti: false,
          isChecked: false,
        }
      );
    });

    test('radio is disabled', () => {
      const onClick = jest.fn();
      renderSelectableItem({
        ...defaultProps,
        onClick,
        disabled: true,
        isMulti: false
      });

      expect(onClick).not.toHaveBeenCalled();

      const input = screen.getByRole('radio');

      userEvent.click(input);

      expect(input).toBeDisabled();
      expect(onClick).not.toHaveBeenCalled();
    });

    test('radio is readOnly', () => {
      const onClick = jest.fn();
      renderSelectableItem({
        ...defaultProps,
        onClick,
        readOnly: true,
        isMulti: false
      });

      expect(onClick).not.toHaveBeenCalled();

      const input = screen.getByRole('radio');

      userEvent.click(input);

      expect(input).toHaveProperty('readOnly', true);
      expect(onClick).not.toHaveBeenCalled();
    });

  });



});
