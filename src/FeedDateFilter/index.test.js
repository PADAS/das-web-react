import React from 'react';
import { render, screen } from '@testing-library/react';

import FeedDateFilter from './';

const dateRange = { lower: null, upper: null };
const updateFilter = jest.fn();

it('renders without crashing', () => {
  render(<FeedDateFilter
    dateRange={dateRange}
    updateFilter={updateFilter}
  />);
});
