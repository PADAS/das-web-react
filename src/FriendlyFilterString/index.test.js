import React from 'react';
import { render, screen } from '@testing-library/react';

import FriendlyFilterString from '.';
import { EVENT_SORT_OPTIONS, SORT_DIRECTION } from '../utils/event-filter';

describe('FriendlyFilterString', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern').setSystemTime(new Date('2022-02-20').getTime());
  });

  test('prints a friendly string for a non-filtered case', async () => {
    render(<FriendlyFilterString
      dateRange={{ lower: '2022-02-15T06:00:00.000Z', upper: '2022-03-15T06:00:00.000Z' }}
      totalFeedCount={20}
    />);

    expect(await screen.findByText('20 results')).toBeDefined();
    expect(await screen.findByText('from')).toBeDefined();
    expect(await screen.findByText('5 days ago until 23 days from now')).toBeDefined();
  });

  test('prints a friendly string for a filtered case', async () => {
    render(<FriendlyFilterString
      dateRange={{ lower: '2022-02-20T06:00:00.000Z', upper: '2022-03-20T12:00:00.000Z' }}
      isFiltered
      totalFeedCount={7}
    />);

    expect(await screen.findByText('7 results')).toBeDefined();
    expect(await screen.findByText('filtered from')).toBeDefined();
    expect(await screen.findByText('about 6 hours ago until 29 days from now')).toBeDefined();
  });

  test('prints a friendly string for a sorted case', async () => {
    render(<FriendlyFilterString
      dateRange={{ lower: '2022-01-20T06:00:00.000Z', upper: '2022-02-20T12:00:00.000Z' }}
      isFiltered
      sortConfig={[SORT_DIRECTION.up, EVENT_SORT_OPTIONS[1]]}
      totalFeedCount={50}
    />);

    expect(await screen.findByText('50 results')).toBeDefined();
    expect(await screen.findByText('filtered from')).toBeDefined();
    expect(await screen.findByText('about 1 month ago until about 12 hours from now')).toBeDefined();
    expect(await screen.findByText(', sorted ascending by')).toBeDefined();
    expect(await screen.findByText('created date')).toBeDefined();
  });
});
