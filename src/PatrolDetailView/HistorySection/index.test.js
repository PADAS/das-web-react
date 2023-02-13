import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HistorySection from './';

describe('PatrolDetailView - HistorySection', () => {
  const patrolFormMock = {
    files: [],
    notes: [],
    patrol_segments: [{ events: [], updates: [] }],
    updates: [
      {
        message: 'Updated fields: State is open',
        time: '2022-02-03T20:07:21.798089+00:00',
        user: {
          username: 'lchavez',
          first_name: 'Luis',
          last_name: 'Chavez',
        },
      },
      {
        message: 'Updated fields: State is cancelled',
        time: '2022-02-03T20:07:18.751933+00:00',
        user: {
          username: 'lchavez',
          first_name: 'Luis',
          last_name: 'Chavez',
        },
      },
      {
        message: 'Patrol Added',
        time: '2022-02-01T14:51:39.331717+00:00',
        user: {
          username: 'joshuak',
          first_name: 'Joshua',
          last_name: 'Krautwurst',
        },
      }
    ],
  };

  test('renders the updates automatically in descending order', async () => {
    render(<HistorySection patrolForm={patrolFormMock} />);

    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findByText('Luis Chavez'))).toBeDefined();
    expect((await within(items[1]).findByText('Luis Chavez'))).toBeDefined();
    expect((await within(items[2]).findByText('Joshua Krautwurst'))).toBeDefined();
  });

  test('orders the updates in ascending order when clicking the sort button', async () => {
    render(<HistorySection patrolForm={patrolFormMock} />);

    const sortButton = await screen.findByRole('button');
    userEvent.click(sortButton);
    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findByText('Joshua Krautwurst'))).toBeDefined();
    expect((await within(items[1]).findByText('Luis Chavez'))).toBeDefined();
    expect((await within(items[2]).findByText('Luis Chavez'))).toBeDefined();
  });
});
