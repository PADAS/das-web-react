import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import { newPatrol, overduePatrol } from '../../__test-helpers/fixtures/patrols';
import { mockStore } from '../../__test-helpers/MockStore';

import PlanTab from './';

const store = {
  data: {
    eventSchemas: {
      globalSchema: {
        properties: {
          reported_by: {
            enum_ext: [{
              value: { id: 'Leader 1' },
            }, {
              value: { id: 'Leader 2' },
            }],
          },
        },
      },
    },
    patrolLeaderSchema: {
      trackedbySchema: {
        properties: {
          leader: {
            enum_ext: [{
              value: {
                content_type: 'observations.subject',
                id: 'dba0e0a6-0083-41be-a0eb-99e956977748',
                name: 'Alex',
                subject_type: 'person',
                subject_subtype: 'ranger',
                common_name: null,
                additional: {},
                created_at: '2021-08-31T14:42:06.701541-07:00',
                updated_at: '2021-08-31T14:42:06.701557-07:00',
                is_active: true,
                tracks_available: false,
                image_url: '/static/ranger-black.svg'
              },
            }, {
              value: { id: 'Leader 2' },
            }],
          },
        },
      },
    },
    subjectStore: {},
  },
};

test('rendering without crashing', () => {
  render(<Provider store={mockStore(store)}>
    <PlanTab patrolForm={overduePatrol} />
  </Provider>);
});

describe('Tracked by input', () => {
  test('it should show the field empty for new patrols', async () => {
    render(<Provider store={mockStore(store)}>
      <PlanTab patrolForm={overduePatrol} />
    </Provider>);
  });

  test('it should show the name of the tracking subject for patrols that already exist', async () => {
    render(<Provider store={mockStore(store)}>
      <PlanTab patrolForm={overduePatrol} />
    </Provider>);

    expect(screen.getByText('Alex')).toBeTruthy();
  });

  test('removes the subject id user press on cross icon', async () => {
    render(<Provider store={mockStore(store)}>
      <PlanTab patrolForm={newPatrol} />
    </Provider>);

    const patrolLeaderInput = await screen.findByRole('textbox');
    expect(() => screen.getByText('Alex')).toThrow();
    expect(patrolLeaderInput).toHaveAttribute('value', '');
  });
});
