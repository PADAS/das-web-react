import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
    userEvent.type(searchInput, 'ER');
    expect(changeMock).toHaveBeenCalledTimes(2);
  });

  test('it should clear the search input after clicking the reset button', async () => {
    const resetButton = await screen.getByTestId('reset-search-button');
    userEvent.click(resetButton);
    expect(clearMock).toHaveBeenCalledTimes(1);
  });
});