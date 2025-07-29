import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';

import SearchBar from './';

describe('SearchBar', () => {
  const renderSearchBar = (props) => render(<SearchBar value="" {...props} />);

  test('adds a custom class name', async () => {
    renderSearchBar({ className: 'className' });

    expect(screen.getByTestId('searchBar')).toHaveClass('className');
  });

  test('focuses the input when clicking the wrapper', async () => {
    renderSearchBar({ 'aria-label': 'Search bar' });

    await userEvent.click(screen.getByTestId('searchBar'));

    expect(screen.getByRole('searchbox', { name: 'Search bar' })).toHaveFocus();
  });

  test('changes the search when the user types in the search input', async () => {
    const onChange = jest.fn();

    renderSearchBar({ 'aria-label': 'Search bar', onChange });

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search bar' }), 'S');

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('shows a search bar without clear button', async () => {
    renderSearchBar({ value: 'Search' });

    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  test('does not show the clear button if there is no value', async () => {
    const onClear = jest.fn();

    renderSearchBar({ onClear });

    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  test('shows a clear button when there is a value', async () => {
    const onClear = jest.fn();

    renderSearchBar({ onClear, value: 'Search' });

    expect(screen.getByRole('button', { name: 'Clear search' })).toBeVisible();
  });

  test('clears the search when the user clicks the clear button', async () => {
    const onClear = jest.fn();

    renderSearchBar({ onClear, value: 'Search' });

    expect(onClear).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
