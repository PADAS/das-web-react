import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fetchEvent } from '../../../../../ducks/events';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { events } from '../../../../../__test-helpers/fixtures/events';
import patrols, { multiLegPatrol } from '../../../../../__test-helpers/fixtures/patrols';
import { render, screen } from '../../../../../test-utils';
import { SYSTEM_CONFIG_FLAGS } from '../../../../../constants';
import { TrackerContext } from '../../../../../utils/analytics';

import Activity from './';

jest.mock('../../../../../ducks/events', () => ({
  ...jest.requireActual('../../../../../ducks/events'),
  fetchEvent: jest.fn(),
}));

describe('SideBar - PatrolsManager - PatrolOverview - Overview - Activity', () => {
  let store;
  beforeEach(() => {
    fetchEvent.mockImplementation(() => () => Promise.resolve());

    store = {
      data: {
        eventStore: {},
        eventTypes: [],
        patrolTypes: [],
      },
      view: {
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
        },
      },
    };
  });

  const renderActivity = (patrol, props) => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track: jest.fn() }}>
        <Activity existingNotes={patrol.notes} patrol={patrol} {...props} />
      </TrackerContext.Provider>
    </Provider>
  );

  test('shows the empty state when the patrol has no activity yet', () => {
    renderActivity(patrols[0]);

    expect(screen.getByText('Patrol activity will appear here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Patrol' })).toBeInTheDocument();
  });

  test('does not show the empty state when the patrol has activity', () => {
    renderActivity(multiLegPatrol);

    expect(screen.queryByText('Patrol activity will appear here')).not.toBeInTheDocument();
  });

  test('sorts the feed with its own sort button', async () => {
    renderActivity(multiLegPatrol);

    const sortButton = screen.getByRole('button', { name: 'Sort activity in ascending order' });

    await userEvent.click(sortButton);

    expect(screen.getByRole('button', { name: 'Sort activity in descending order' })).toBeInTheDocument();
  });

  test('disables the expand all button when there is nothing to expand or collapse', () => {
    renderActivity(multiLegPatrol);

    const expandAllButton = screen.getByRole('button', { name: 'Expand all' });

    expect(expandAllButton).toBeDisabled();
  });

  test('expands and collapses every item with its own expand all button', async () => {
    const patrolWithNote = patrols[13];

    renderActivity(patrolWithNote);

    const expandAllButton = screen.getByRole('button', { name: 'Expand all' });

    await userEvent.click(expandAllButton);

    expect(screen.getByRole('button', { name: 'Collapse all' })).toBeInTheDocument();
  });

  test('excludes events already contained in an incident collection from the activity list', () => {
    const containedEvent = { ...events[1], id: 'contained-event' };
    const collectionEvent = { ...events[0], id: 'collection-event', is_collection: true, contains: [{ related_event: { id: 'contained-event' } }] };
    const collectionWithoutContains = { ...events[1], id: 'empty-collection', is_collection: true, contains: null };

    const patrolWithCollection = {
      ...patrols[0],
      patrol_segments: patrols[0].patrol_segments.map(
        (segment) => ({ ...segment, events: [collectionEvent, containedEvent, collectionWithoutContains] })
      ),
    };

    renderActivity(patrolWithCollection);

    expect(screen.getByTestId('activitySection-collapse-collection-event')).toBeInTheDocument();
    expect(screen.getByTestId('activitySection-collapse-empty-collection')).toBeInTheDocument();
    expect(screen.queryByTestId('activitySection-collapse-contained-event')).not.toBeInTheDocument();
  });

  test('shows a leg transition milestone between two legs, and the patrol started milestone, but not the patrol ended milestone while the patrol has not ended', () => {
    renderActivity(multiLegPatrol);

    expect(screen.getByText('Patrol Started')).toBeInTheDocument();
    expect(screen.getByText('Leg 1 Ended, Leg 2 Started')).toBeInTheDocument();
    expect(screen.queryByText('Patrol Ended')).not.toBeInTheDocument();
  });

  const patrolWithLegTimes = (...timeRanges) => ({
    ...multiLegPatrol,
    patrol_segments: timeRanges.map((timeRange, index) => ({
      ...multiLegPatrol.patrol_segments[0],
      events: [],
      id: `leg-${index}`,
      time_range: timeRange,
    })),
  });

  test('numbers a leg transition after the two legs it joins', () => {
    renderActivity(patrolWithLegTimes(
      { start_time: '2026-04-13T01:00:00.000-07:00', end_time: '2026-04-13T02:00:00.000-07:00' },
      { start_time: '2026-04-13T02:00:00.000-07:00', end_time: '2026-04-13T03:00:00.000-07:00' },
      { start_time: '2026-04-13T03:00:00.000-07:00', end_time: null },
    ));

    expect(screen.getByText('Leg 1 Ended, Leg 2 Started')).toBeInTheDocument();
    expect(screen.getByText('Leg 2 Ended, Leg 3 Started')).toBeInTheDocument();
  });

  test('skips the transition of a leg that never ended without renumbering the remaining ones', () => {
    renderActivity(patrolWithLegTimes(
      { start_time: '2026-04-13T01:00:00.000-07:00', end_time: null },
      { start_time: '2026-04-13T02:00:00.000-07:00', end_time: '2026-04-13T03:00:00.000-07:00' },
      { start_time: '2026-04-13T03:00:00.000-07:00', end_time: null },
    ));

    expect(screen.queryByText('Leg 1 Ended, Leg 2 Started')).not.toBeInTheDocument();
    expect(screen.getByText('Leg 2 Ended, Leg 3 Started')).toBeInTheDocument();
  });

  test('does not show a leg transition that is still scheduled ahead', () => {
    renderActivity(patrolWithLegTimes(
      { start_time: '2026-04-13T01:00:00.000-07:00', end_time: '2099-01-01T00:00:00.000-07:00' },
      { start_time: '2099-01-01T00:00:00.000-07:00', end_time: null },
    ));

    expect(screen.queryByText('Leg 1 Ended, Leg 2 Started')).not.toBeInTheDocument();
  });

  test('shows no transition for a patrol with a single leg', () => {
    renderActivity(patrolWithLegTimes(
      { start_time: '2026-04-13T01:00:00.000-07:00', end_time: '2026-04-13T02:00:00.000-07:00' },
    ));

    expect(screen.queryByText('Leg 1 Ended, Leg 2 Started')).not.toBeInTheDocument();
    expect(screen.getByText('Patrol Started')).toBeInTheDocument();
  });

  test('shows the patrol ended milestone once the last leg has ended', () => {
    const endedMultiLegPatrol = {
      ...multiLegPatrol,
      patrol_segments: multiLegPatrol.patrol_segments.map((segment, index) => index === 1
        ? { ...segment, time_range: { ...segment.time_range, end_time: '2026-04-13T03:00:00.000-07:00' } }
        : segment),
    };

    renderActivity(endedMultiLegPatrol);

    expect(screen.getByText('Patrol Ended')).toBeInTheDocument();
  });

  test('does not crash when the patrol is missing files or notes', () => {
    const partiallyLoadedPatrol = { ...multiLegPatrol, files: undefined, notes: undefined };

    renderActivity(partiallyLoadedPatrol);

    expect(screen.queryByText('Patrol activity will appear here')).not.toBeInTheDocument();
  });

  test('does not trigger the start patrol action yet', async () => {
    renderActivity(patrols[0]);

    await userEvent.click(screen.getByRole('button', { name: 'Start Patrol' }));

    expect(screen.getByRole('button', { name: 'Start Patrol' })).toBeInTheDocument();
  });
});
