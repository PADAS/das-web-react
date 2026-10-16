import FeedDateFilter from './';
import { render } from '../test-utils';

const dateRange = { lower: null, upper: null };
const updateFilter = jest.fn();

it('renders without crashing', () => {
  expect(() => render(<FeedDateFilter
    dateRange={dateRange}
    updateFilter={updateFilter}
  />)).not.toThrow();
});
