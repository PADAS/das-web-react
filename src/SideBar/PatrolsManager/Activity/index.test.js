import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../../../__test-helpers/fixtures/event-types';
import { fetchEvent, removeEventFromPatrol } from '../../../ducks/events';
import { mockStore } from '../../../__test-helpers/MockStore';
import { events } from '../../../__test-helpers/fixtures/events';
import patrols, { multiLegPatrol } from '../../../__test-helpers/fixtures/patrols';
import { render, screen } from '../../../test-utils';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../../constants';
import { report } from '../../../__test-helpers/fixtures/reports';
import { TrackerContext } from '../../../utils/analytics';

import Activity from './';

jest.mock('../../../ducks/events', () => ({
  ...jest.requireActual('../../../ducks/events'),
  fetchEvent: jest.fn(),
  removeEventFromPatrol: jest.fn(),
}));

describe('SideBar - PatrolsManager - Activity', () => {
  const onCancelNote = jest.fn();
  const onChangeNote = jest.fn();
  const onDeleteAttachment = jest.fn();
  const onDeleteNote = jest.fn();
  const onDoneNote = jest.fn();

  let store;
  beforeEach(() => {
    fetchEvent.mockImplementation(() => () => Promise.resolve());

    store = {
      data: {
        eventStore: {},
        eventCategories: {},
        eventTypes: [],
        patrolTypes: [],
        subjectStore: {},
        tracks: {},
      },
      view: {
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
        },
      },
    };
  });

  const renderActivity = (props) => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track: jest.fn() }}>
        <Activity
          attachments={[]}
          containedEvents={[]}
          emptyStateMessage="Patrol activity will appear here"
          endTime={null}
          endTitle="Patrol Ended"
          existingNotes={[]}
          newAttachments={[]}
          newNotes={[]}
          onCancelNote={onCancelNote}
          onChangeNote={onChangeNote}
          onDeleteAttachment={onDeleteAttachment}
          onDeleteNote={onDeleteNote}
          onDoneNote={onDoneNote}
          patrol={patrols[0]}
          startTime={null}
          startTitle="Patrol Started"
          {...props}
        />
      </TrackerContext.Provider>
    </Provider>
  );

  test('shows the empty state message it is given when there is no activity', () => {
    renderActivity();

    expect(screen.getByText('Patrol activity will appear here')).toBeInTheDocument();
  });

  test('shows the empty state message of a leg when given one', () => {
    renderActivity({ emptyStateMessage: 'Leg activity will appear here' });

    expect(screen.getByText('Leg activity will appear here')).toBeInTheDocument();
  });

  test('does not show the empty state when there is activity', () => {
    renderActivity({ containedEvents: [events[0]] });

    expect(screen.queryByText('Patrol activity will appear here')).not.toBeInTheDocument();
  });

  test('lists only the events it is given', () => {
    renderActivity({ containedEvents: [{ ...events[0], id: 'listed-event' }] });

    expect(screen.getByTestId('activitySection-collapse-listed-event')).toBeInTheDocument();
  });

  test('counts the events it is given in the summary stats', () => {
    renderActivity({ containedEvents: [events[0], events[1]] });

    expect(screen.getByText('Events').nextElementSibling).toHaveTextContent('2');
  });

  test('shows the start title it is given once the start time has passed', () => {
    renderActivity({ startTime: new Date('2026-04-13T01:00:00.000-07:00'), startTitle: 'Leg 2 started' });

    expect(screen.getByText('Leg 2 started')).toBeInTheDocument();
  });

  test('shows the end title it is given once the end time has passed', () => {
    renderActivity({ endTime: new Date('2026-04-13T02:00:00.000-07:00'), endTitle: 'Leg 2 ended' });

    expect(screen.getByText('Leg 2 ended')).toBeInTheDocument();
  });

  test('shows the milestones it is given', () => {
    renderActivity({
      milestones: [{ date: '2026-04-13T02:00:00.000-07:00', id: 'leg-1', title: 'Leg 1 Ended, Leg 2 Started' }],
    });

    expect(screen.getByText('Leg 1 Ended, Leg 2 Started')).toBeInTheDocument();
  });

  test('sorts the feed with its own sort button', async () => {
    renderActivity({ containedEvents: [events[0]] });

    await userEvent.click(screen.getByRole('button', { name: 'Sort activity in ascending order' }));

    expect(screen.getByRole('button', { name: 'Sort activity in descending order' })).toBeInTheDocument();
  });

  test('disables the expand all button when there is nothing to expand or collapse', () => {
    renderActivity();

    expect(screen.getByRole('button', { name: 'Expand all' })).toBeDisabled();
  });

  test('expands and collapses every item with its own expand all button', async () => {
    renderActivity({ existingNotes: patrols[13].notes });

    await userEvent.click(screen.getByRole('button', { name: 'Expand all' }));

    expect(screen.getByRole('button', { name: 'Collapse all' })).toBeInTheDocument();
  });

  test('shows the stats of a leg when given one', () => {
    renderActivity({ patrol: multiLegPatrol, patrolSegment: multiLegPatrol.patrol_segments[0] });

    expect(screen.getByText('Duration')).toBeInTheDocument();
  });

  describe('removing an event from the patrol', () => {
    let patrolEvent;

    beforeEach(() => {
      patrolEvent = { ...report, patrols: [patrols[0].id], updates: [] };
      removeEventFromPatrol.mockImplementation(() => () => Promise.resolve());
      store.data.eventStore[report.id] = patrolEvent;
      store.data.eventTypes = eventTypes;
      store.data.user = {
        permissions: {
          [PERMISSION_KEYS.EVENT_RELATED_SEGMENTS]: [PERMISSIONS.DELETE],
          [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ, PERMISSIONS.UPDATE],
        },
      };
      store.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT] = true;
    });

    test('removes an event of the patrol, then focuses the activity heading', async () => {
      renderActivity({ containedEvents: [report] });

      await userEvent.click(screen.getByRole('button', { name: 'Expand Light' }));
      await userEvent.click(screen.getByRole('button', { name: 'Remove from Patrol' }));

      expect(removeEventFromPatrol).toHaveBeenCalledWith(report.id, patrols[0].id);
      expect(screen.getByRole('heading', { name: 'Activity' })).toHaveFocus();
    });

    test('removes an event from the patrol it shows, whichever patrol the event names first', async () => {
      store.data.eventStore[report.id] = { ...patrolEvent, patrols: ['other-patrol-id', patrols[0].id] };
      renderActivity({ containedEvents: [report] });

      await userEvent.click(screen.getByRole('button', { name: 'Expand Light' }));
      await userEvent.click(screen.getByRole('button', { name: 'Remove from Patrol' }));

      expect(removeEventFromPatrol).toHaveBeenCalledWith(report.id, patrols[0].id);
    });

    test('keeps the event, and the focus on its remove button, when the removal fails', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      removeEventFromPatrol.mockImplementation(() => () => Promise.reject(new Error('Not found')));
      renderActivity({ containedEvents: [report] });

      await userEvent.click(screen.getByRole('button', { name: 'Expand Light' }));
      await userEvent.click(screen.getByRole('button', { name: 'Remove from Patrol' }));

      expect(screen.getByRole('button', { name: 'Remove from Patrol' })).toHaveAttribute('aria-busy', 'false');
      expect(screen.getByRole('button', { name: 'Remove from Patrol' })).toHaveFocus();
    });

    test('does not offer to remove an event when patrol management is off', async () => {
      store.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT] = false;
      renderActivity({ containedEvents: [report] });

      await userEvent.click(screen.getByRole('button', { name: 'Expand Light' }));

      expect(screen.queryByRole('button', { name: 'Remove from Patrol' })).toBeNull();
    });
  });
});
