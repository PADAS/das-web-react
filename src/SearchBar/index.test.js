import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
// import userEvent from '@testing-library/user-event';

import SearchBar from './';

const changeMock = jest.fn((value) => {});
const clearMock = jest.fn();

test('rendering without crashing', () => {
  render(<SearchBar placeholder='Search here!' value='' onChange={changeMock} onClear={clearMock}/>);
});

describe('searching and reset', () => {
  beforeEach(async () => {
    render(<SearchBar placeholder='Search here!' value='' onChange={changeMock} onClear={clearMock}/>);
  });

  afterEach(() => {
    changeMock.mockClear();
    clearMock.mockClear();
  });

  test('it should show the placeholder in the input', async () => {
    const searchInput = await screen.getByTestId('search-input');
    expect(searchInput).toHaveAttribute('placeholder', 'Search here!');
  });

  test('it should call onChange', () => {
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(changeMock).toHaveBeenCalledTimes(1);
  });

  test('it should clear the search input after clicking the reset button', async () => {
    const resetButton = await screen.getByTestId('reset-search-button');
    fireEvent.click(resetButton);
    expect(clearMock).toHaveBeenCalledTimes(1);
  });
});