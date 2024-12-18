import React from 'react';
import { render, screen } from '../test-utils';

import NumericInput from './';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';

describe('NumericInput', () => {

  const initialProps = {
    id: 'aNumber',
    setValue: () => {},
    value: '10',
    min: 1,
    max: 12
  };

  const renderNumericInput = (props = initialProps) => render(
    <NumericInput {...props} />
  );

  test('display proper default value', () => {
    renderNumericInput();

    expect( screen.getByRole('textbox').value ).toBe('10');
  });

  test('enters valid digit', async () => {
    const setValue = jest.fn();
    renderNumericInput({ ...initialProps, value: null, setValue });

    const numberInput = screen.getByRole('textbox');
    await userEvent.type( numberInput, '10');

    expect(setValue).toHaveBeenCalledWith(10);
  });

  test('enters valid float', async () => {
    const setValue = jest.fn((value) => {
    });
    renderNumericInput({ ...initialProps, value: '', setValue });

    const numberInput = screen.getByRole('textbox');
    await userEvent.type( numberInput, '1.5');

    await expect(setValue).toHaveBeenCalledWith('1.5');
  });

  test('augment number using keyboard up arrow', () => {
    const setValue = jest.fn();
    renderNumericInput({ ...initialProps, value: '9', setValue });

    const numberInput = screen.getByRole('textbox');

    fireEvent.keyDown(numberInput, {
      key: 'ArrowUp',
      code: 'ArrowUp'
    });

    expect(setValue).toHaveBeenCalledWith(10);
  });

  test('decrease number using keyboard down arrow', async () => {
    const setValue = jest.fn();
    renderNumericInput({ ...initialProps, value: '9', setValue });

    const numberInput = screen.getByRole('textbox');

    fireEvent.keyDown(numberInput, {
      key: 'ArrowDown',
      code: 'ArrowDown'
    });

    expect(setValue).toHaveBeenCalledWith(8);
  });

  test('augment number using up button', async () => {
    const setValue = jest.fn();
    renderNumericInput({ ...initialProps, value: '9', setValue });

    const [upArrowButton] = screen.getAllByRole('button');

    await userEvent.click(upArrowButton);

    expect(setValue).toHaveBeenCalledWith(10);
  });

  test('decrease number using up button', async () => {
    const setValue = jest.fn();
    renderNumericInput({ ...initialProps, value: '9', setValue });

    const [, downArrowButton] = screen.getAllByRole('button');

    await userEvent.click(downArrowButton);

    expect(setValue).toHaveBeenCalledWith(8);
  });

  test('prevent to typing letters', async () => {
    const setValue = jest.fn();
    renderNumericInput({ ...initialProps, setValue });

    const numberInput = screen.getByRole('textbox');
    await userEvent.type( numberInput, 'AG');

    expect(setValue).toHaveBeenCalledTimes(1);
  });

  test('allow typing only one decimal symbol', async () => {
    const setValue = jest.fn();
    renderNumericInput({ ...initialProps, value: '1', setValue });

    const numberInput = screen.getByRole('textbox');
    await userEvent.type( numberInput, '.0');
    await userEvent.type( numberInput, '.');

    expect(setValue).toHaveBeenCalledTimes(3);
    expect(setValue).toHaveBeenCalledWith(1.0);
  });

});
