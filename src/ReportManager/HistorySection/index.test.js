import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrackerContext } from '../../utils/analytics';


import HistorySection from './';

describe('ReportManager - HistorySection', () => {
  const reportUpdatesMock = [{
    message: 'Added the report to an incident',
    secondaryMessage: '155 Incident collection',
    time: new Date('2022-12-17T03:20:00'),
    user: { first_name: 'John', last_name: 'Nairobi' },
  }, {
    message: 'Automatically resolved the report',
    secondaryMessage: 'Status: resolved',
    time: new Date('2022-12-15T03:25:00'),
    user: { first_name: 'EarthRanger' },
  }, {
    message: 'Added an attachment',
    secondaryMessage: null,
    time: new Date('2022-12-15T03:20:00'),
    user: { first_name: 'Kim', last_name: 'Johanna' },
  }];

  const Wrapper = ({ children }) =>
    <TrackerContext.Provider value={{ track: jest.fn() }}>
      {children}
    </TrackerContext.Provider>;

  test('renders the updates automatically in descending order', async () => {
    render(<HistorySection reportUpdates={reportUpdatesMock} />, { wrapper: Wrapper });

    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findByText('John Nairobi'))).toBeDefined();
    expect((await within(items[1]).findByText('EarthRanger'))).toBeDefined();
    expect((await within(items[2]).findByText('Kim Johanna'))).toBeDefined();
  });

  test('orders the updates in ascending order when clicking the sort button', async () => {
    render(<HistorySection reportUpdates={reportUpdatesMock} />, { wrapper: Wrapper });

    const sortButton = await screen.findByRole('button');
    userEvent.click(sortButton);
    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findByText('Kim Johanna'))).toBeDefined();
    expect((await within(items[1]).findByText('EarthRanger'))).toBeDefined();
    expect((await within(items[2]).findByText('John Nairobi'))).toBeDefined();
  });
});
