import React from 'react';


import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/dom';

import ColumnSort from './';

const SORT_OPTIONS = [
  {
    label: 'Option 1',
    value: 'option_1',
  },
  {
    label: 'Option 2',
    value: 'option_2',
  },
  {
    label: 'Option 3',
    value: 'option_3',
  },
];

const onSortChange = jest.fn();


afterEach(() => {
  onSortChange.mockClear();
});

test('rendering without crashing', () => {
  render(<ColumnSort options={SORT_OPTIONS} value={['+', SORT_OPTIONS[0]]} onChange={onSortChange} />);
});

describe('ColumnSort control', () => {
  let sortHeader, rendered;

  beforeEach(async () => {
    rendered = render(<ColumnSort options={SORT_OPTIONS} value={['-', SORT_OPTIONS[0]]} onChange={onSortChange} />);

    sortHeader = await screen.findByTestId('sort-header');
  });

  test('showing the sort option menu', async () => {
    sortHeader.click();

    await screen.findByTestId('sort-options');
  });

  describe('changing the sort property', () => {
    beforeEach(async () => {
      sortHeader.click();
      await screen.findByTestId('sort-options');
    });

    test('clicking a sort option selects a new sort property', () => {
      const sortOptionsContainer = screen.getByTestId('sort-options');
      const sortOptions = within(sortOptionsContainer).getAllByRole('button');

      userEvent.click(sortOptions[2]);

      expect(onSortChange).toHaveBeenCalledWith(['-', SORT_OPTIONS[2]]);

    });
  });

  describe('changing the sort order', () => {
    test('positive sorting', () => {
      const sortDirectionControl = screen.getByTestId('sort-direction-toggle');

      userEvent.click(sortDirectionControl);
      expect(onSortChange).toHaveBeenCalledWith(['+', SORT_OPTIONS[0]]);
    });

    test('negative sorting', () => {
      rendered.rerender(<ColumnSort options={SORT_OPTIONS} value={['+', SORT_OPTIONS[2]]} onChange={onSortChange} />);
      const sortDirectionControl = screen.getByTestId('sort-direction-toggle');

      userEvent.click(sortDirectionControl);
      expect(onSortChange).toHaveBeenCalledWith(['-', SORT_OPTIONS[2]]);
    });
  });

});

