import React from 'react';

import FeedDateFilter from './';
import { render } from '../test-utils';

const dateRange = { lower: null, upper: null };
const updateFilter = jest.fn();

it('renders without crashing', () => {
  render(<FeedDateFilter
    dateRange={dateRange}
    updateFilter={updateFilter}
  />);
});
