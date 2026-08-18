import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { act, render, screen, waitFor } from '../../../../../../test-utils';
import { mockStore } from '../../../../../../__test-helpers/MockStore';
import { TrackerContext } from '../../../../../../utils/analytics';

import SummaryStats from './';

const RANGER = {
  id: 'ranger-1',
  image_url: '/static/ranger-black.svg',
  name: 'Ranger Amara',
};

const DOG = {
  id: 'dog-1',
  image_url: null,
  name: 'K9 Rex',
};

const PILOT = {
  id: 'pilot-1',
  image_url: null,
  name: 'Pilot Zoe',
};

const FIRST_LEG_TIME_RANGE = { end_time: '2026-04-13T02:00:00.000Z', start_time: '2026-04-13T01:00:00.000Z' };
const SECOND_LEG_TIME_RANGE = { end_time: '2026-04-13T03:30:00.000Z', start_time: '2026-04-13T02:00:00.000Z' };
const THIRD_LEG_TIME_RANGE = { end_time: '2026-04-13T04:00:00.000Z', start_time: '2026-04-13T03:30:00.000Z' };

const REFRESH_INTERVAL = 30_000;

// Tracks are stored most recent position first.
const trackFor = (coordinates, timeRange) => ({
  fetchedDateRange: { since: timeRange.start_time },
  points: { features: [], type: 'FeatureCollection' },
  track: {
    features: [{
      geometry: { coordinates, type: 'LineString' },
      properties: { coordinateProperties: { times: [timeRange.end_time, timeRange.start_time] } },
      type: 'Feature',
    }],
    type: 'FeatureCollection',
  },
});

describe('SideBar - PatrolsManager - PatrolOverview - Overview - Activity - SummaryStats', () => {
  const endedPatrol = {
    id: 'patrol-1',
    patrol_segments: [
      { id: 'leg-1', leader: RANGER, time_range: FIRST_LEG_TIME_RANGE },
      { id: 'leg-2', leader: DOG, time_range: SECOND_LEG_TIME_RANGE },
    ],
    state: 'open',
  };

  const activePatrol = {
    ...endedPatrol,
    patrol_segments: [
      endedPatrol.patrol_segments[0],
      { ...endedPatrol.patrol_segments[1], time_range: { ...SECOND_LEG_TIME_RANGE, end_time: null } },
    ],
  };

  let reduxStore, store, tracker, user;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-13T04:00:00.000Z'));

    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime, delay: null });

    tracker = { track: jest.fn() };

    store = {
      data: {
        tracks: {
          [DOG.id]: trackFor([[0, 0.5], [0, 0]], SECOND_LEG_TIME_RANGE),
          [RANGER.id]: trackFor([[1, 0], [0, 0]], FIRST_LEG_TIME_RANGE),
        },
      },
      view: {},
    };

    reduxStore = mockStore(() => store);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const summaryStats = (props) => <Provider store={reduxStore}>
    <TrackerContext.Provider value={tracker}>
      <SummaryStats eventCount={0} patrol={endedPatrol} {...props} />
    </TrackerContext.Provider>
  </Provider>;

  const renderSummaryStats = (props) => {
    const { rerender } = render(summaryStats(props));

    return { rerenderSummaryStats: (nextProps) => rerender(summaryStats(nextProps)) };
  };

  const readSummaryStats = () => Object.fromEntries(
    [...document.querySelectorAll('dt')].map((label) => [label.textContent, label.nextElementSibling.textContent])
  );

  const openTrackedSubjectsMenu = async (subjectName) => {
    await user.click(screen.getByRole('button', { name: `Distance covered by ${subjectName}. Change the tracked subject` }));
  };

  test('shows the duration, paused time, active time, distance and event count of the patrol', () => {
    renderSummaryStats({ eventCount: 3 });

    expect(readSummaryStats()).toEqual({
      'Active Time': '2h 30m',
      'Distance': '55.6km',
      'Duration': '2h 30m',
      'Events': '3',
      'Paused Time': '0m',
    });
  });

  test('measures the duration of an ongoing patrol up to the current time', () => {
    renderSummaryStats({ patrol: activePatrol });

    expect(readSummaryStats()['Duration']).toBe('3h');
  });

  test('refreshes the elapsed times of an active patrol as time passes', () => {
    renderSummaryStats({ patrol: activePatrol });

    expect(readSummaryStats()).toMatchObject({ 'Active Time': '3h', 'Duration': '3h' });

    act(() => {
      jest.advanceTimersByTime(REFRESH_INTERVAL - 1);
    });

    expect(readSummaryStats()).toMatchObject({ 'Active Time': '3h', 'Duration': '3h' });

    act(() => {
      jest.advanceTimersByTime(30 * 60 * 1000);
    });

    expect(readSummaryStats()).toMatchObject({ 'Active Time': '3h 30m', 'Duration': '3h 30m' });
  });

  test('does not refresh the elapsed times of a patrol that is no longer active', () => {
    renderSummaryStats();

    act(() => {
      jest.advanceTimersByTime(30 * 60 * 1000);
    });

    expect(readSummaryStats()['Duration']).toBe('2h 30m');
    expect(jest.getTimerCount()).toBe(0);
  });

  test('measures a cancelled patrol up to the moment it was cancelled', () => {
    const cancelledPatrol = {
      ...activePatrol,
      state: 'cancelled',
      updates: [
        { message: 'Updated fields: State is cancelled', time: '2026-04-13T03:00:00.000Z', type: 'update_patrol_state' },
      ],
    };

    renderSummaryStats({ patrol: cancelledPatrol });

    expect(readSummaryStats()['Duration']).toBe('2h');
    expect(jest.getTimerCount()).toBe(0);
  });

  test('measures a done patrol up to the moment it was marked done', () => {
    const donePatrol = {
      ...activePatrol,
      state: 'done',
      updates: [
        { message: 'Updated fields: State is done', time: '2026-04-13T03:00:00.000Z', type: 'update_patrol_state' },
      ],
    };

    renderSummaryStats({ patrol: donePatrol });

    expect(readSummaryStats()['Duration']).toBe('2h');
    expect(jest.getTimerCount()).toBe(0);
  });

  test('shows a dash on every measurement of a patrol that has not started', () => {
    const scheduledPatrol = {
      ...endedPatrol,
      patrol_segments: [{
        id: 'leg-1',
        leader: RANGER,
        scheduled_start: '2026-04-14T01:00:00.000Z',
        time_range: { end_time: null, start_time: null },
      }],
    };

    renderSummaryStats({ eventCount: 2, patrol: scheduledPatrol });

    expect(readSummaryStats()).toEqual({
      'Active Time': '-',
      'Distance': '-',
      'Duration': '-',
      'Events': '2',
      'Paused Time': '-',
    });
  });

  test('shows a dash as the distance of a patrol without tracked subjects', () => {
    const patrolWithoutLeaders = {
      ...endedPatrol,
      patrol_segments: endedPatrol.patrol_segments.map((leg) => ({ ...leg, leader: null })),
    };

    renderSummaryStats({ patrol: patrolWithoutLeaders });

    expect(readSummaryStats()['Distance']).toBe('-');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('shows no distance covered by a tracked subject whose track is not loaded yet', () => {
    store.data.tracks = {};

    renderSummaryStats();

    expect(readSummaryStats()['Distance']).toBe('0km');
  });

  test('adds up the distance a tracked subject covered across every leg it took part in', () => {
    const singleSubjectPatrol = {
      ...endedPatrol,
      patrol_segments: [
        { id: 'leg-1', leader: RANGER, time_range: FIRST_LEG_TIME_RANGE },
        { id: 'leg-2', leader: RANGER, time_range: SECOND_LEG_TIME_RANGE },
      ],
    };
    store.data.tracks = {
      [RANGER.id]: {
        fetchedDateRange: { since: FIRST_LEG_TIME_RANGE.start_time },
        points: { features: [], type: 'FeatureCollection' },
        track: {
          features: [{
            geometry: { coordinates: [[2, 0], [1, 0], [0, 0]], type: 'LineString' },
            properties: {
              coordinateProperties: {
                times: [
                  SECOND_LEG_TIME_RANGE.end_time,
                  SECOND_LEG_TIME_RANGE.start_time,
                  FIRST_LEG_TIME_RANGE.start_time,
                ],
              },
            },
            type: 'Feature',
          }],
          type: 'FeatureCollection',
        },
      },
    };

    renderSummaryStats({ patrol: singleSubjectPatrol });

    expect(readSummaryStats()['Distance']).toBe('222.4km');
  });

  test('shows the distance covered by the patrol leader by default', () => {
    renderSummaryStats();

    expect(screen.getByRole('button', { name: 'Distance covered by K9 Rex. Change the tracked subject' }))
      .toBeInTheDocument();
    expect(readSummaryStats()['Distance']).toBe('55.6km');
  });

  test('lists every tracked subject of the patrol, the patrol leader first', async () => {
    renderSummaryStats();

    await openTrackedSubjectsMenu('K9 Rex');

    expect(screen.getByRole('menu', { name: 'Tracked subjects' })).toBeInTheDocument();
    expect(screen.getAllByRole('menuitemradio').map((option) => option.title)).toEqual(['K9 Rex', 'Ranger Amara']);
  });

  test('checks the tracked subject the distance belongs to', async () => {
    renderSummaryStats();

    await openTrackedSubjectsMenu('K9 Rex');

    expect(screen.getByRole('menuitemradio', { name: 'K9 Rex Patrol leader' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Ranger Amara' })).not.toBeChecked();
  });

  test('shows the icon of the tracked subjects that have one', async () => {
    renderSummaryStats();

    await openTrackedSubjectsMenu('K9 Rex');

    expect(screen.getByRole('menuitemradio', { name: 'Ranger Amara' }).querySelector('img')).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'K9 Rex Patrol leader' }).querySelector('img')).toBeNull();
  });

  test('shows the distance covered by the tracked subject chosen from the menu', async () => {
    renderSummaryStats();

    await openTrackedSubjectsMenu('K9 Rex');
    await user.click(screen.getByRole('menuitemradio', { name: 'Ranger Amara' }));

    expect(readSummaryStats()['Distance']).toBe('111.2km');
    expect(screen.getByRole('button', { name: 'Distance covered by Ranger Amara. Change the tracked subject' }))
      .toBeInTheDocument();
  });

  test('closes the menu and gives the focus back to its button after choosing a tracked subject', async () => {
    renderSummaryStats();

    await openTrackedSubjectsMenu('K9 Rex');
    await user.click(screen.getByRole('menuitemradio', { name: 'Ranger Amara' }));

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Distance covered by Ranger Amara. Change the tracked subject' }))
      .toHaveFocus();
  });

  test('reports choosing a tracked subject to the analytics tracker', async () => {
    renderSummaryStats();

    await openTrackedSubjectsMenu('K9 Rex');

    expect(tracker.track).not.toHaveBeenCalled();

    await user.click(screen.getByRole('menuitemradio', { name: 'Ranger Amara' }));

    expect(tracker.track).toHaveBeenCalledWith('Select the subject of the distance stat in patrol overview');
  });

  test('moves the focus among the tracked subjects that are left after the patrol changes', async () => {
    const threeLeggedPatrol = {
      ...endedPatrol,
      patrol_segments: [
        ...endedPatrol.patrol_segments,
        { id: 'leg-3', leader: PILOT, time_range: THIRD_LEG_TIME_RANGE },
      ],
    };

    const { rerenderSummaryStats } = renderSummaryStats({ patrol: threeLeggedPatrol });

    await openTrackedSubjectsMenu('Pilot Zoe');
    await user.keyboard('{End}');

    expect(screen.getByRole('menuitemradio', { name: 'K9 Rex' })).toHaveFocus();

    rerenderSummaryStats({ patrol: endedPatrol });

    await user.keyboard('{End}');

    expect(screen.getByRole('menuitemradio', { name: 'Ranger Amara' })).toHaveFocus();
  });

  describe('with the tracked subjects menu open', () => {
    let distanceSubjectButton;
    beforeEach(async () => {
      renderSummaryStats();

      await openTrackedSubjectsMenu('K9 Rex');

      distanceSubjectButton = screen.getByRole('button', {
        name: 'Distance covered by K9 Rex. Change the tracked subject',
      });
    });

    test('reports the menu as expanded', () => {
      expect(distanceSubjectButton).toHaveAttribute('aria-expanded', 'true');
      expect(distanceSubjectButton).toHaveAttribute('aria-controls', screen.getByRole('menu').id);
    });

    test('closes the menu with its own button', async () => {
      await user.click(distanceSubjectButton);

      expect(distanceSubjectButton).toHaveAttribute('aria-expanded', 'false');
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    });

    test('focuses the checked tracked subject', () => {
      expect(screen.getByRole('menuitemradio', { name: 'K9 Rex Patrol leader' })).toHaveFocus();
    });

    test('moves the focus to the next tracked subject with the down arrow key, wrapping around', async () => {
      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('menuitemradio', { name: 'Ranger Amara' })).toHaveFocus();

      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('menuitemradio', { name: 'K9 Rex Patrol leader' })).toHaveFocus();
    });

    test('moves the focus to the previous tracked subject with the up arrow key, wrapping around', async () => {
      await user.keyboard('{ArrowUp}');

      expect(screen.getByRole('menuitemradio', { name: 'Ranger Amara' })).toHaveFocus();

      await user.keyboard('{ArrowUp}');

      expect(screen.getByRole('menuitemradio', { name: 'K9 Rex Patrol leader' })).toHaveFocus();
    });

    test('moves the focus to the last tracked subject with the end key', async () => {
      await user.keyboard('{End}');

      expect(screen.getByRole('menuitemradio', { name: 'Ranger Amara' })).toHaveFocus();
    });

    test('moves the focus to the first tracked subject with the home key', async () => {
      await user.keyboard('{End}');
      await user.keyboard('{Home}');

      expect(screen.getByRole('menuitemradio', { name: 'K9 Rex Patrol leader' })).toHaveFocus();
    });

    test('leaves the checked tracked subject alone while moving the focus around', async () => {
      await user.keyboard('{ArrowDown}');

      expect(readSummaryStats()['Distance']).toBe('55.6km');
      expect(screen.getByRole('menuitemradio', { name: 'K9 Rex Patrol leader' })).toBeChecked();
    });

    test('closes the menu and gives the focus back to its button with the escape key', async () => {
      await user.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
      expect(distanceSubjectButton).toHaveFocus();
    });

    test('closes the menu and gives the focus back to its button with the tab key', async () => {
      await user.keyboard('{Tab}');

      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
      expect(distanceSubjectButton).toHaveFocus();
    });

    test('ignores any other key', async () => {
      await user.keyboard('a');

      expect(screen.getByRole('menu', { name: 'Tracked subjects' })).toBeInTheDocument();
      expect(screen.getByRole('menuitemradio', { name: 'K9 Rex Patrol leader' })).toHaveFocus();
    });

    test('closes the menu and gives the focus back to its button when clicking outside of it', async () => {
      await user.click(document.body);

      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
      expect(distanceSubjectButton).toHaveFocus();
    });

    test('leaves the focus alone when the track of a tracked subject updates', async () => {
      await user.keyboard('{ArrowDown}');

      store = {
        ...store,
        data: {
          ...store.data,
          tracks: { ...store.data.tracks, [DOG.id]: trackFor([[0, 1], [0, 0]], SECOND_LEG_TIME_RANGE) },
        },
      };
      act(() => {
        reduxStore.dispatch({ type: 'SOCKET_STATUS_UPDATE' });
      });

      expect(readSummaryStats()['Distance']).toBe('111.2km');
      expect(screen.getByRole('menuitemradio', { name: 'Ranger Amara' })).toHaveFocus();
    });
  });
});
