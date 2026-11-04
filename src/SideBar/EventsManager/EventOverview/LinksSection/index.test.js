import { http, HttpResponse } from 'msw/http';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import { activePatrol } from '../../../../__test-helpers/fixtures/patrols';
import { eventTypes } from '../../../../__test-helpers/fixtures/event-types';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../../../constants';
import { render, screen, within } from '../../../../test-utils';
import { report } from '../../../../__test-helpers/fixtures/reports';
import { TRACKS_API_URL } from '../../../../ducks/tracks';

import LinksSection from './';

const server = setupServer(
  http.get(
    TRACKS_API_URL(activePatrol.patrol_segments[0].leader.id),
    () => HttpResponse.json({ data: { features: {} } })
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SideBar - EventsManager - EventOverview - LinksSection', () => {
  const incident = { ...report, id: 'incident-id', is_collection: true, serial_number: 20 };
  const linkedEvent = { ...report, id: 'linked-event-id', serial_number: 30 };

  let event;
  let onRemoveFromIncident;
  let onRemoveFromPatrol;
  let state;

  beforeEach(() => {
    event = {
      ...report,
      is_contained_in: [{ related_event: { id: incident.id } }],
      is_linked_to: [{ related_event: { id: linkedEvent.id } }],
      patrols: [activePatrol.id],
    };
    onRemoveFromIncident = jest.fn(() => Promise.resolve());
    onRemoveFromPatrol = jest.fn(() => Promise.resolve());
    state = {
      data: {
        eventCategories: {},
        eventFilter: { filter: { date_range: {} } },
        eventTypes,
        patrolTypes: [],
        subjectStore: {},
        tracks: {},
        user: {
          permissions: {
            [PERMISSION_KEYS.EVENT_RELATIONSHIPS]: [PERMISSIONS.DELETE],
            [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ],
          },
        },
      },
      view: {
        patrolTrackState: { hiddenSubjects: {}, pinned: [], visible: [] },
        systemConfig: { [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true },
        timeSliderState: {},
        trackSettings: { origin: 'eventFilter' },
      },
    };
  });

  const renderLinksSection = (props) => render(<Provider store={mockStore(state)}>
    <LinksSection
      linkedPatrols={[activePatrol]}
      linkedReports={[incident, linkedEvent]}
      onRemoveFromIncident={onRemoveFromIncident}
      onRemoveFromPatrol={onRemoveFromPatrol}
      report={event}
      {...props}
    />
  </Provider>);

  test('lists the links of the event', () => {
    renderLinksSection();

    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(3);
  });

  test('offers to remove the event from its incident and its patrol, but not from the events it is linked to', () => {
    renderLinksSection();

    expect(screen.getByRole('button', { name: 'Remove from incident 20' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove from patrol 1595' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove from incident 30' })).toBeNull();
  });

  test('does not offer to remove the event from its incident without the delete permission', () => {
    state.data.user.permissions = { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ] };

    renderLinksSection();

    expect(screen.queryByRole('button', { name: 'Remove from incident 20' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Remove from patrol 1595' })).toBeInTheDocument();
  });

  test('does not offer to remove the event from its patrol when patrol management is off', () => {
    state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT] = false;

    renderLinksSection();

    expect(screen.queryByRole('button', { name: 'Remove from patrol 1595' })).toBeNull();
  });

  test('removes the event from its incident and from its patrol', async () => {
    renderLinksSection();

    await userEvent.click(screen.getByRole('button', { name: 'Remove from incident 20' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove from patrol 1595' }));

    expect(onRemoveFromIncident).toHaveBeenCalledWith(event, incident.id);
    expect(onRemoveFromPatrol).toHaveBeenCalledWith(event);
  });

  test('offers to remove the event from each incident that holds it, and removes it from the one picked', async () => {
    const otherIncident = { ...incident, id: 'other-incident-id', serial_number: 21 };
    event.is_contained_in = [...event.is_contained_in, { related_event: { id: otherIncident.id } }];
    renderLinksSection({ linkedReports: [incident, otherIncident, linkedEvent] });

    await userEvent.click(screen.getByRole('button', { name: 'Remove from incident 21' }));

    expect(screen.getByRole('button', { name: 'Remove from incident 20' })).toBeInTheDocument();
    expect(onRemoveFromIncident).toHaveBeenCalledWith(event, otherIncident.id);
  });

  test('marks only the pressed one of two incidents busy', async () => {
    const otherIncident = { ...incident, id: 'other-incident-id', serial_number: 21 };
    event.is_contained_in = [...event.is_contained_in, { related_event: { id: otherIncident.id } }];
    onRemoveFromIncident.mockReturnValue(new Promise(() => {}));
    renderLinksSection({ linkedReports: [incident, otherIncident] });

    await userEvent.click(screen.getByRole('button', { name: 'Remove from incident 21' }));

    expect(screen.getByRole('button', { name: 'Remove from incident 21' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Remove from incident 20' })).toHaveAttribute('aria-busy', 'false');
  });

  test('marks only the pressed button busy, and disables both, while the links change', async () => {
    onRemoveFromPatrol.mockReturnValue(new Promise(() => {}));
    const { rerender } = renderLinksSection();

    await userEvent.click(screen.getByRole('button', { name: 'Remove from patrol 1595' }));
    rerender(<Provider store={mockStore(state)}>
      <LinksSection
        isChangingLinks
        linkedPatrols={[activePatrol]}
        linkedReports={[incident, linkedEvent]}
        onRemoveFromIncident={onRemoveFromIncident}
        onRemoveFromPatrol={onRemoveFromPatrol}
        report={event}
      />
    </Provider>);

    expect(screen.getByRole('button', { name: 'Remove from patrol 1595' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Remove from incident 20' })).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByRole('button', { name: 'Remove from incident 20' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Remove from patrol 1595' })).toHaveAttribute('aria-disabled', 'true');
  });
});
