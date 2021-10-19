import React from 'react';


import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/dom';

import ArrowUp from '../common/images/icons/arrow-up.svg';
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
const ORDER_OPTIONS = [
  {
    label: 'Newest to oldest',
    value: '-',
  },
  {
    label: 'Oldest to newest',
    value: '+',
  },
];

const onSortChange = jest.fn();


afterEach(() => {
  onSortChange.mockClear();
});

test('rendering without crashing', () => {
  render(<ColumnSort sortOptions={SORT_OPTIONS} orderOptions={ORDER_OPTIONS} value={['+', SORT_OPTIONS[0]]} onChange={onSortChange} />);
});

describe('ColumnSort control', () => {
  let sortPopoverTrigger, rendered;

  beforeEach(async () => {
    rendered = render(<ColumnSort sortOptions={SORT_OPTIONS} orderOptions={ORDER_OPTIONS} value={['-', SORT_OPTIONS[0]]} onChange={onSortChange} />);

    sortPopoverTrigger = await screen.findByTestId('sort-popover-trigger');
  });

  test('showing the sort option menu', async () => {
    sortPopoverTrigger.click();

    await screen.findByTestId('sort-options');
  });

  test('showing the order option menu', async () => {
    sortPopoverTrigger.click();

    await screen.findByTestId('order-options');
  });

  describe('changing the sort property', () => {
    beforeEach(async () => {
      sortPopoverTrigger.click();
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
    beforeEach(async () => {
      sortPopoverTrigger.click();
      await screen.findByTestId('order-options');
    });

    test('clicking a order option selects a new sort order', () => {
      const orderOptionsContainer = screen.getByTestId('order-options');
      const orderOptions = within(orderOptionsContainer).getAllByRole('button');

      userEvent.click(orderOptions[1]);

      expect(onSortChange).toHaveBeenCalledWith(['+', SORT_OPTIONS[0]]);
    });

    test('positive sorting', () => {
      const sortDirectionControl = screen.getByTestId('sort-direction-toggle');

      userEvent.click(sortDirectionControl);
      expect(onSortChange).toHaveBeenCalledWith(['+', SORT_OPTIONS[0]]);
    });

    test('negative sorting', () => {
      rendered.rerender(<ColumnSort sortOptions={SORT_OPTIONS} orderOptions={ORDER_OPTIONS} value={['+', SORT_OPTIONS[2]]} onChange={onSortChange} />);
      const sortDirectionControl = screen.getByTestId('sort-direction-toggle');

      userEvent.click(sortDirectionControl);
      expect(onSortChange).toHaveBeenCalledWith(['-', SORT_OPTIONS[2]]);
    });
  });

});

