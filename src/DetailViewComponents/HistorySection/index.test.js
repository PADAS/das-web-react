import React from 'react';
import userEvent from '@testing-library/user-event';

import { TrackerContext } from '../../utils/analytics';
import { render, screen, within } from '../../test-utils';

import HistorySection from './';

describe('DetailViewComponents - HistorySection', () => {
  const updatesMock = [{
    message: 'Added the report to an incident',
    time: new Date('2022-12-17T03:20:00'),
    user: { first_name: 'John', last_name: 'Nairobi' },
  }, {
    message: 'Automatically resolved the report',
    time: new Date('2022-12-15T03:25:00'),
    user: { first_name: 'EarthRanger' },
  }, {
    message: 'Added an attachment',
    time: new Date('2022-12-15T03:20:00'),
    user: { first_name: 'Kim', last_name: 'Johanna' },
  }];

  const Wrapper = ({ children }) =>
    <TrackerContext.Provider value={{ track: jest.fn() }}>
      {children}
    </TrackerContext.Provider>;

  test('renders the updates automatically in descending order', async () => {
    render(<HistorySection updates={updatesMock} />, { wrapper: Wrapper });

    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findByText('John Nairobi'))).toBeDefined();
    expect((await within(items[1]).findByText('EarthRanger'))).toBeDefined();
    expect((await within(items[2]).findByText('Kim Johanna'))).toBeDefined();
  });

  test('orders the updates in ascending order when clicking the sort button', async () => {
    render(<HistorySection updates={updatesMock} />, { wrapper: Wrapper });

    const sortButton = await screen.findByRole('button');
    userEvent.click(sortButton);
    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findByText('Kim Johanna'))).toBeDefined();
    expect((await within(items[1]).findByText('EarthRanger'))).toBeDefined();
    expect((await within(items[2]).findByText('John Nairobi'))).toBeDefined();
  });
});
