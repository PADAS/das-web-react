import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';

import { newPatrol, overduePatrol, patrolDefaultStoreData } from '../../__test-helpers/fixtures/patrols';
import { mockStore } from '../../__test-helpers/MockStore';

import PlanTab from './';

let store = patrolDefaultStoreData;

store.data.patrolLeaderSchema.trackedbySchema.properties.leader.enum_ext.push(
  {
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
  }
);

test('rendering without crashing', () => {
  render(<Provider store={mockStore(store)}>
    <PlanTab patrolForm={overduePatrol} />
  </Provider>);
});

describe('Tracked by input', () => {
  test('it should show the name of the tracking subject for patrols that already exist', async () => {
    render(<Provider store={mockStore(store)}>
      <PlanTab patrolForm={overduePatrol} />
    </Provider>);

    const reportedBySelect = await screen.getByTestId('reported-by-select');
    const patrolLeaderInput = within(reportedBySelect).getByTestId('select-single-value');

    const selectionImage = patrolLeaderInput.children[0];
    const selectionText = patrolLeaderInput.children[1];

    expect(within(reportedBySelect).queryByText('Select Device...')).toBeNull();
    expect(selectionImage).toHaveAttribute('alt', 'Radio icon for Alex value');
    expect(selectionText).toHaveTextContent('Alex');
  });

  test('it should show the field empty for new patrols', async () => {
    render(<Provider store={mockStore(store)}>
      <PlanTab patrolForm={newPatrol} />
    </Provider>);

    const reportedBySelect = await screen.getByTestId('reported-by-select');
    const placeholderText = within(reportedBySelect).queryByText('Select Device...');

    expect(() => within(reportedBySelect).getByTestId('select-single-value')).toThrow();
    expect(placeholderText).toBeDefined();
  });
});


describe('Objective input', () => {
  test('it should show the objective for patrols that already exist', async () => {
    render(<Provider store={mockStore(store)}>
      <PlanTab patrolForm={overduePatrol} />
    </Provider>);

    const objectiveInput = await screen.getByTestId('patrol-objective-input');
    expect(objectiveInput).toHaveTextContent('very ambitious objective');
  });

  test('it should show the field empty for new patrols', async () => {
    render(<Provider store={mockStore(store)}>
      <PlanTab patrolForm={newPatrol} />
    </Provider>);

    const objectiveInput = await screen.getByTestId('patrol-objective-input');
    expect(objectiveInput).toHaveTextContent('');
  });
});