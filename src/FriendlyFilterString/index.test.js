import React from 'react';
import { render, screen } from '@testing-library/react';

import FriendlyFilterString from '.';
import { EVENT_SORT_OPTIONS, SORT_DIRECTION } from '../utils/event-filter';

describe('FriendlyFilterString', () => {
  beforeAll(() => {
    const mockSystemTime = new Date('2022-02-20');
    mockSystemTime.setUTCHours(20);

    jest.useFakeTimers('modern').setSystemTime(mockSystemTime.getTime());
  });

  test('prints a friendly string for a non-filtered case', async () => {
    render(<FriendlyFilterString
      dateRange={{ lower: '2022-02-15T06:00:00.000Z', upper: '2022-03-15T06:00:00.000Z' }}
      totalFeedCount={20}
    />);

    expect(await screen.findByText('20 results')).toBeDefined();
    expect(await screen.findByText('from')).toBeDefined();
    expect(await screen.findByText('6 days ago until 22 days from now')).toBeDefined();
  });

  test('prints a friendly string for a filtered case', async () => {
    render(<FriendlyFilterString
      dateRange={{ lower: '2022-02-18T06:00:00.000Z', upper: '2022-03-18T12:00:00.000Z' }}
      isFiltered
      totalFeedCount={7}
    />);

    expect(await screen.findByText('7 results')).toBeDefined();
    expect(await screen.findByText('filtered from')).toBeDefined();
    expect(await screen.findByText('3 days ago until 26 days from now')).toBeDefined();
  });

  test('prints a friendly string for a sorted case', async () => {
    render(<FriendlyFilterString
      dateRange={{ lower: '2022-01-22T06:00:00.000Z', upper: '2022-02-22T12:00:00.000Z' }}
      isFiltered
      sortConfig={[SORT_DIRECTION.up, EVENT_SORT_OPTIONS[1]]}
      totalFeedCount={50}
    />);

    expect(await screen.findByText('50 results')).toBeDefined();
    expect(await screen.findByText('filtered from')).toBeDefined();
    expect(await screen.findByText('30 days ago until 1 day from now')).toBeDefined();
    expect(await screen.findByText(', sorted ascending by')).toBeDefined();
    expect(await screen.findByText('created date')).toBeDefined();
  });
});