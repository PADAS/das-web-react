import React from 'react';
import { Provider } from 'react-redux';

import { fetchEvent } from '../../../../ducks/events';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { events } from '../../../../__test-helpers/fixtures/events';
import { PATROL_UI_STATES, SYSTEM_CONFIG_FLAGS } from '../../../../constants';
import patrolTypes from '../../../../__test-helpers/fixtures/patrol-types';
import patrols, { multiLegPatrol } from '../../../../__test-helpers/fixtures/patrols';
import { render, screen } from '../../../../test-utils';
import { TRACK_LENGTH_ORIGINS } from '../../../../ducks/tracks';

import Overview from './';

jest.mock('../../../../ducks/events', () => ({
  ...jest.requireActual('../../../../ducks/events'),
  fetchEvent: jest.fn(),
}));

describe('SideBar - PatrolsManager - PatrolOverview - Overview', () => {
  const onCancelNote = jest.fn();
  const onChangeNote = jest.fn();
  const onDeleteAttachment = jest.fn();
  const onDeleteNote = jest.fn();
  const onDoneNote = jest.fn();

  const patrolWithLeader = multiLegPatrol;

  let store;
  beforeEach(() => {
    fetchEvent.mockImplementation(() => () => Promise.resolve());

    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        eventStore: {},
        eventTypes: [],
        patrolTypes,
        subjectStore: {},
        tracks: {},
      },
      view: {
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
        },
        timeSliderState: {},
        trackSettings: { length: 21, origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH },
      },
    };
  });

  const renderOverview = (props) => render(
    <Provider store={mockStore(store)}>
      <Overview
        attachments={[]}
        newAttachments={[]}
        newNotes={[]}
        onCancelNote={onCancelNote}
        onChangeNote={onChangeNote}
        onDeleteAttachment={onDeleteAttachment}
        onDeleteNote={onDeleteNote}
        onDoneNote={onDoneNote}
        patrol={patrolWithLeader}
        patrolState={PATROL_UI_STATES.ACTIVE}
        {...props}
      />
    </Provider>
  );

  const patrolWithLegTimes = (...timeRanges) => ({
    ...multiLegPatrol,
    patrol_segments: timeRanges.map((timeRange, index) => ({
      ...multiLegPatrol.patrol_segments[0],
      events: [],
      id: `leg-${index}`,
      time_range: timeRange,
    })),
  });

  const patrolWithLegEvents = (legEvents) => ({
    ...patrols[0],
    patrol_segments: patrols[0].patrol_segments.map((segment) => ({ ...segment, events: legEvents })),
  });

  test('shows the legs', () => {
    renderOverview();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(patrolWithLeader.patrol_segments.length + 1);
  });

  test('shows the activity', () => {
    renderOverview();

    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
  });

  test('shows the empty state when the patrol has no activity yet', () => {
    renderOverview({ patrol: patrols[0] });

    expect(screen.getByText('Patrol activity will appear here')).toBeInTheDocument();
  });

  test('does not show the empty state when the patrol has activity', () => {
    renderOverview();

    expect(screen.queryByText('Patrol activity will appear here')).not.toBeInTheDocument();
  });

  test('excludes events already contained in an incident collection from the activity list', () => {
    const containedEvent = { ...events[1], id: 'contained-event' };
    const collectionEvent = {
      ...events[0],
      contains: [{ related_event: { id: 'contained-event' } }],
      id: 'collection-event',
      is_collection: true,
    };
    const collectionWithoutContains = { ...events[1], contains: null, id: 'empty-collection', is_collection: true };

    renderOverview({
      patrol: patrolWithLegEvents([collectionEvent, containedEvent, collectionWithoutContains]),
    });

    expect(screen.getByTestId('activitySection-collapse-collection-event')).toBeInTheDocument();
    expect(screen.getByTestId('activitySection-collapse-empty-collection')).toBeInTheDocument();
    expect(screen.queryByTestId('activitySection-collapse-contained-event')).not.toBeInTheDocument();
  });

  test('leaves the events already contained in an incident collection out of the summary stats event count', () => {
    const containedEvent = { ...events[1], id: 'contained-event' };
    const collectionEvent = {
      ...events[0],
      contains: [{ related_event: { id: 'contained-event' } }],
      id: 'collection-event',
      is_collection: true,
    };

    renderOverview({ patrol: patrolWithLegEvents([collectionEvent, containedEvent]) });

    expect(screen.getByText('Events').nextElementSibling).toHaveTextContent('1');
  });

  test('shows the patrol started milestone, but no patrol ended milestone while the patrol runs', () => {
    renderOverview();

    expect(screen.getByText('Patrol Started')).toBeInTheDocument();
    expect(screen.queryByText('Patrol Ended')).not.toBeInTheDocument();
  });

  test('marks the end of a leg that ran and the start of the one after it', () => {
    renderOverview();

    expect(screen.getByText('Leg 1 Ended')).toBeInTheDocument();
    expect(screen.getByText('Leg 2 Started')).toBeInTheDocument();
  });

  test('marks a pause as the patrol stopping and picking back up, not as a leg', () => {
    const [legOne, legTwo] = patrolWithLeader.patrol_segments;
    const pause = {
      ...legOne,
      id: 'pause-1',
      is_pause: true,
      time_range: { end_time: legTwo.time_range.start_time, start_time: legOne.time_range.end_time },
    };

    renderOverview({ patrol: { ...patrolWithLeader, patrol_segments: [legOne, pause, legTwo] } });

    expect(screen.getByText(/Patrol Paused for/)).toBeInTheDocument();
    expect(screen.getByText('Patrol Resumed')).toBeInTheDocument();
    expect(screen.queryByText('Leg 2 Started')).not.toBeInTheDocument();
    expect(screen.getByText('Leg 3 Started')).toBeInTheDocument();
  });

  test('marks the end of a leg whose successor never started', () => {
    renderOverview({
      patrol: patrolWithLegTimes(
        { end_time: '2026-04-13T02:00:00.000-07:00', start_time: '2026-04-13T01:00:00.000-07:00' },
        { end_time: null, start_time: null },
      ),
    });

    expect(screen.getByText('Leg 1 Ended')).toBeInTheDocument();
    expect(screen.queryByText('Leg 2 Started')).not.toBeInTheDocument();
  });

  test('leaves the first leg start and the last leg end to the patrol own milestones', () => {
    renderOverview({
      patrol: patrolWithLegTimes(
        { end_time: '2026-04-13T02:00:00.000-07:00', start_time: '2026-04-13T01:00:00.000-07:00' },
        { end_time: '2026-04-13T03:00:00.000-07:00', start_time: '2026-04-13T02:00:00.000-07:00' },
      ),
    });

    expect(screen.queryByText('Leg 1 Started')).not.toBeInTheDocument();
    expect(screen.queryByText('Leg 2 Ended')).not.toBeInTheDocument();
    expect(screen.getByText('Patrol Started')).toBeInTheDocument();
    expect(screen.getByText('Patrol Ended')).toBeInTheDocument();
  });

  test('marks both ends of a leg in the middle of the patrol', () => {
    renderOverview({
      patrol: patrolWithLegTimes(
        { end_time: '2026-04-13T02:00:00.000-07:00', start_time: '2026-04-13T01:00:00.000-07:00' },
        { end_time: '2026-04-13T03:00:00.000-07:00', start_time: '2026-04-13T02:00:00.000-07:00' },
        { end_time: null, start_time: '2026-04-13T03:00:00.000-07:00' },
      ),
    });

    expect(screen.getByText('Leg 2 Started')).toBeInTheDocument();
    expect(screen.getByText('Leg 2 Ended')).toBeInTheDocument();
    expect(screen.getByText('Leg 3 Started')).toBeInTheDocument();
  });

  test('does not show a leg milestone that is still scheduled ahead', () => {
    renderOverview({
      patrol: patrolWithLegTimes(
        { end_time: '2099-01-01T00:00:00.000-07:00', start_time: '2026-04-13T01:00:00.000-07:00' },
        { end_time: null, start_time: '2099-01-01T00:00:00.000-07:00' },
      ),
    });

    expect(screen.queryByText('Leg 1 Ended')).not.toBeInTheDocument();
    expect(screen.queryByText('Leg 2 Started')).not.toBeInTheDocument();
  });

  test('shows no leg milestone for a patrol with a single leg', () => {
    renderOverview({
      patrol: patrolWithLegTimes({
        end_time: '2026-04-13T02:00:00.000-07:00',
        start_time: '2026-04-13T01:00:00.000-07:00',
      }),
    });

    expect(screen.queryByText('Leg 1 Started')).not.toBeInTheDocument();
    expect(screen.queryByText('Leg 1 Ended')).not.toBeInTheDocument();
    expect(screen.getByText('Patrol Started')).toBeInTheDocument();
  });

  test('does not mark the end a closed patrol stamped on a leg that never ran', () => {
    renderOverview({
      patrol: {
        ...patrolWithLegTimes(
          { end_time: '2026-04-13T02:00:00.000-07:00', start_time: '2026-04-13T01:00:00.000-07:00' },
          { end_time: '2026-04-13T02:00:00.000-07:00', start_time: null },
          { end_time: '2026-04-13T02:00:00.000-07:00', start_time: null },
        ),
        state: 'done',
      },
    });

    expect(screen.getByText('Leg 1 Ended')).toBeInTheDocument();
    expect(screen.queryByText('Leg 2 Ended')).not.toBeInTheDocument();
    expect(screen.queryByText('Leg 2 Started')).not.toBeInTheDocument();
  });

  test('shows the patrol ended milestone once the last leg has ended', () => {
    renderOverview({
      patrol: {
        ...multiLegPatrol,
        patrol_segments: multiLegPatrol.patrol_segments.map((segment, index) => index === 1
          ? { ...segment, time_range: { ...segment.time_range, end_time: '2026-04-13T03:00:00.000-07:00' } }
          : segment),
      },
    });

    expect(screen.getByText('Patrol Ended')).toBeInTheDocument();
  });

  test('does not crash when the patrol is missing files or notes', () => {
    renderOverview({ patrol: { ...multiLegPatrol, files: undefined, notes: undefined } });

    expect(screen.queryByText('Patrol activity will appear here')).not.toBeInTheDocument();
  });
});
