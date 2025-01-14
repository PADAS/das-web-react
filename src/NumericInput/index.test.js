import React from 'react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';

import { render, screen } from '../test-utils';

import NumericInput from './';

describe('NumericInput', () => {

  const initialProps = {
    id: 'aNumber',
    onChange: () => {},
    value: 10,
    min: 1,
    max: 12,
    required: false,
    disabled: false,
    readOnly: false,
    inputClassName: ''
  };

  const renderNumericInput = (props = initialProps) => render(
    <NumericInput {...props} />
  );

  test('display proper default value', () => {
    renderNumericInput();

    expect( screen.getByRole('textbox').value ).toBe('10');
  });

  test('enters valid digit', async () => {
    const onChange = jest.fn();
    renderNumericInput({ ...initialProps, value: null, onChange });

    const numberInput = screen.getByRole('textbox');
    await userEvent.type( numberInput, '10');

    expect(onChange).toHaveBeenCalledWith(10);
  });

  test('enters valid float', async () => {
    const onChange = jest.fn();
    renderNumericInput({ ...initialProps, value: '', onChange });

    const numberInput = screen.getByRole('textbox');
    await userEvent.type( numberInput, '1.5');

    await expect(onChange).toHaveBeenCalledWith(1.5);
  });

  test('increase number using keyboard up arrow', () => {
    const onChange = jest.fn();
    renderNumericInput({ ...initialProps, value: '9', onChange });

    const numberInput = screen.getByRole('textbox');

    fireEvent.keyDown(numberInput, {
      key: 'ArrowUp',
      code: 'ArrowUp'
    });

    expect(onChange).toHaveBeenCalledWith(10);
  });

  test('decrement number using keyboard down arrow', async () => {
    const onChange = jest.fn();
    renderNumericInput({ ...initialProps, value: '9', onChange });

    const numberInput = screen.getByRole('textbox');

    fireEvent.keyDown(numberInput, {
      key: 'ArrowDown',
      code: 'ArrowDown'
    });

    expect(onChange).toHaveBeenCalledWith(8);
  });

  test('increase number using up button', async () => {
    const onChange = jest.fn();
    renderNumericInput({ ...initialProps, value: '9', onChange });

    const [upArrowButton] = screen.getAllByRole('button');

    await userEvent.click(upArrowButton);

    expect(onChange).toHaveBeenCalledWith(10);
  });

  test('decrement number using down button', async () => {
    const onChange = jest.fn();
    renderNumericInput({ ...initialProps, value: '9', onChange });

    const [, downArrowButton] = screen.getAllByRole('button');

    await userEvent.click(downArrowButton);

    expect(onChange).toHaveBeenCalledWith(8);
  });

  test('prevent to typing letters', async () => {
    const onChange = jest.fn();
    renderNumericInput({ ...initialProps, onChange });

    const numberInput = screen.getByRole('textbox');
    await userEvent.type( numberInput, 'AG');

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('allow typing only one decimal point symbol', async () => {
    const onChange = jest.fn();
    renderNumericInput({ ...initialProps, value: '1', onChange });

    const numberInput = screen.getByRole('textbox');
    await userEvent.type( numberInput, '.0');
    await userEvent.type( numberInput, '.');

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenCalledWith(1.0);
  });

  test('allow typing only one decimal comma symbol', async () => {
    const onChange = jest.fn();
    renderNumericInput({ ...initialProps, value: '1', onChange });

    const numberInput = screen.getByRole('textbox');
    await userEvent.type( numberInput, ',0');
    await userEvent.type( numberInput, ',');

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenCalledWith(1.0);
  });

});
