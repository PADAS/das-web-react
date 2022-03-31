import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HistoryTab from './';

describe('PatrolDrawer', () => {
  beforeEach(() => {
    render(<HistoryTab patrolForm={{
      files: [],
      notes: [],
      patrol_segments: [
        {
          'id': '25d2a0db-64f2-4742-9881-f2394a663df2',
          'patrol_type': 'The_Don_Patrol',
          'leader': null,
          'scheduled_start': null,
          'scheduled_end': null,
          'time_range': {
            'start_time': '2022-02-01T06:51:31.756000-08:00',
            'end_time': null
          },
          'start_location': null,
          'end_location': null,
          'events': [],
          'image_url': 'https://develop.pamdas.org/static/sprite-src/suspicious_person_rep.svg',
          'icon_id': 'suspicious_person_rep',
          'updates': []
        }
      ],
      updates: [
        {
          'message': 'Updated fields: State is open',
          'time': '2022-02-03T20:07:21.798089+00:00',
          'user': {
            'username': 'lchavez',
            'first_name': 'Luis',
            'last_name': 'Chavez',
            'id': '2cc59835-ac53-4b78-b40a-2aa4ab93fe18',
            'content_type': 'accounts.user'
          },
          'type': 'update_patrol_state'
        },
        {
          'message': 'Updated fields: State is cancelled',
          'time': '2022-02-03T20:07:18.751933+00:00',
          'user': {
            'username': 'lchavez',
            'first_name': 'Luis',
            'last_name': 'Chavez',
            'id': '2cc59835-ac53-4b78-b40a-2aa4ab93fe18',
            'content_type': 'accounts.user'
          },
          'type': 'update_patrol_state'
        },
        {
          'message': 'Patrol Added',
          'time': '2022-02-01T14:51:39.331717+00:00',
          'user': {
            'username': 'joshuak',
            'first_name': 'Joshua',
            'last_name': 'Krautwurst',
            'id': 'ff91fae4-e55b-4beb-8385-c76af78afa36',
            'content_type': 'accounts.user'
          },
          'type': 'add_patrol'
        }
      ],
    }} />);
  });

  test('renders the list of updates correctly', async () => {
    const historyListItems = await screen.findAllByTestId('historyListItem');

    expect(historyListItems).toHaveLength(3);
    expect(historyListItems[0]).toHaveTextContent('Luis ChavezUpdated fields: State is open');
    expect(historyListItems[1]).toHaveTextContent('Luis ChavezUpdated fields: State is cancelled');
    expect(historyListItems[2]).toHaveTextContent('Joshua KrautwurstPatrol Added');
  });

  test('changes the sort direction of the updates when user clicks the button', async () => {
    const sortingButton = await screen.findByRole('button');

    expect((await screen.findAllByTestId('historyListItem'))[0]).toHaveTextContent('Luis ChavezUpdated fields: State is open');

    userEvent.click(sortingButton);

    expect((await screen.findAllByTestId('historyListItem'))[0]).toHaveTextContent('Joshua KrautwurstPatrol Added');
  });
});
