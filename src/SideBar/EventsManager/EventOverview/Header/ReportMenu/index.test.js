import { Provider } from 'react-redux';
import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';
import { ToastContainer } from 'react-toastify';
import { useReactToPrint } from 'react-to-print';
import userEvent from '@testing-library/user-event';

import { addEventToIncident, addEventToPatrol, createEvent, EVENTS_API_URL } from '../../../../../ducks/events';
import { eventTypes } from '../../../../../__test-helpers/fixtures/event-types';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { PATROLS_API_URL } from '../../../../../ducks/patrols';
import patrolTypes from '../../../../../__test-helpers/fixtures/patrol-types';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../../../../constants';
import { render, screen, waitFor } from '../../../../../test-utils';
import { report } from '../../../../../__test-helpers/fixtures/reports';
import { TrackerContext } from '../../../../../utils/analytics';

import ReportMenu from './';

jest.mock('react-to-print', () => ({
  ...jest.requireActual('react-to-print'),
  useReactToPrint: jest.fn(),
}));

jest.mock('../../../../../ducks/events', () => ({
  ...jest.requireActual('../../../../../ducks/events'),
  addEventToIncident: jest.fn(),
  addEventToPatrol: jest.fn(),
  createEvent: jest.fn(),
}));

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SideBar - EventsManager - EventOverview - Header - ReportMenu', () => {
  const incident = { contains: [], event_type: 'incident_collection', id: 'incident-id', is_collection: true, serial_number: 20 };
  const patrol = {
    id: 'patrol-id',
    patrol_segments: [{ id: 'leg-id', patrol_type: 'foot', time_range: { end_time: null, start_time: '2020-01-01T08:00:00Z' } }],
    serial_number: 30,
    state: 'open',
  };

  let handlePrint;
  let onSaveNewReport;
  let state;

  beforeEach(() => {
    handlePrint = jest.fn();
    onSaveNewReport = jest.fn(() => Promise.resolve({ ...report, id: 'saved-event-id' }));

    addEventToIncident.mockImplementation(() => () => Promise.resolve());
    addEventToPatrol.mockImplementation(() => () => Promise.resolve());
    createEvent.mockImplementation(() => () => Promise.resolve({ data: { data: { id: 'new-incident-id', serial_number: 21 } } }));
    useReactToPrint.mockImplementation(() => handlePrint);

    server.use(
      http.get(EVENTS_API_URL, () => HttpResponse.json({ data: { count: 1, next: null, results: [incident] } })),
      http.get(PATROLS_API_URL, () => HttpResponse.json({ data: { count: 1, next: null, results: [patrol] } }))
    );

    state = {
      data: {
        eventCategories: {},
        eventTypes,
        patrolTypes,
        user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ] } },
      },
      view: { systemConfig: { [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true } },
    };
  });

  const renderReportMenu = (props) => render(
    <Provider store={mockStore(state)}>
      <TrackerContext.Provider value={{ track: jest.fn() }}>
        <ReportMenu
          canLinkReport
          hasLocation
          onJumpToLocation={jest.fn()}
          printableContentRef={{ current: null }}
          report={report}
          title="Light"
          {...props}
        />

        <ToastContainer />
      </TrackerContext.Provider>
    </Provider>
  );

  const openMenu = () => userEvent.click(screen.getByRole('button', { name: 'More options' }));

  test('copies the link of the event', async () => {
    const writeText = jest.fn();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    renderReportMenu();

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Copy Event Link' }));

    expect(writeText).toHaveBeenCalledWith(
      'http://localhost/events/d45cb504-4612-41fe-9ea5-f1b423ac3ba4?lnglat=-104.19557197413907,20.75709101172957'
    );
    expect(await screen.findByText('Link copied')).toBeInTheDocument();
  });

  test('prints the event', async () => {
    renderReportMenu();

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Print Event Details' }));

    expect(handlePrint).toHaveBeenCalled();
  });

  test('jumps to the location of the event from its mobile option', async () => {
    const onJumpToLocation = jest.fn();

    renderReportMenu({ onJumpToLocation });

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Jump to location' }));

    expect(onJumpToLocation).toHaveBeenCalled();
  });

  test('disables the jump to location option of an event without a location', async () => {
    renderReportMenu({ hasLocation: false });

    await openMenu();

    expect(screen.getByRole('menuitem', { name: 'Jump to location' })).toBeDisabled();
  });

  test('offers to add an unlinked event to an incident and to a patrol', async () => {
    renderReportMenu();

    await openMenu();

    expect(screen.getByRole('menuitem', { name: 'Add to Incident' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Add to Patrol' })).toBeInTheDocument();
  });

  test('does not offer to link an event being added from somewhere else', async () => {
    renderReportMenu({ canLinkReport: false });

    await openMenu();

    expect(screen.queryByRole('menuitem', { name: 'Add to Incident' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Add to Patrol' })).not.toBeInTheDocument();
  });

  test('does not offer to add an event to a second patrol', async () => {
    renderReportMenu({ report: { ...report, patrols: ['other-patrol-id'] } });

    await openMenu();

    expect(screen.queryByRole('menuitem', { name: 'Add to Patrol' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Add to Incident' })).toBeInTheDocument();
  });

  test('does not offer to add an event to a second incident', async () => {
    renderReportMenu({ report: { ...report, is_contained_in: [{ related_event: { id: 'other-incident-id' } }] } });

    await openMenu();

    expect(screen.queryByRole('menuitem', { name: 'Add to Incident' })).not.toBeInTheDocument();
  });

  test('does not offer to add an incident to another incident', async () => {
    renderReportMenu({ report: { ...report, is_collection: true } });

    await openMenu();

    expect(screen.queryByRole('menuitem', { name: 'Add to Incident' })).not.toBeInTheDocument();
  });

  test('does not offer to link an event whose category the user cannot edit', async () => {
    state.data.eventTypes = eventTypes.map((eventType) => eventType.value === report.event_type
      ? { ...eventType, category: { ...eventType.category, permissions: ['read'] } }
      : eventType);

    renderReportMenu();

    await openMenu();

    expect(screen.queryByRole('menuitem', { name: 'Add to Incident' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Add to Patrol' })).not.toBeInTheDocument();
  });

  test('adds a saved event to the patrol the user picks without saving it again', async () => {
    renderReportMenu({ onSaveNewReport: null });

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add to Patrol' }));
    await userEvent.click(await screen.findByRole('button', { name: /Add to patrol 30/ }));

    expect(addEventToPatrol).toHaveBeenCalledWith(report.id, 'patrol-id');
    expect(onSaveNewReport).not.toHaveBeenCalled();
    expect(await screen.findByText('Event 165634 added to patrol 30.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('adds the event to the incident the user picks', async () => {
    renderReportMenu();

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add to Incident' }));
    await userEvent.click(await screen.findByRole('button', { name: /Add to incident 20/ }));

    expect(addEventToIncident).toHaveBeenCalledWith(report.id, 'incident-id');
  });

  test('adds the event to a new incident', async () => {
    renderReportMenu();

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add to Incident' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Create new incident' }));

    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ priority: report.priority }));
    expect(addEventToIncident).toHaveBeenCalledWith(report.id, 'new-incident-id');
  });

  test('saves a new event before adding it to a patrol', async () => {
    renderReportMenu({ onSaveNewReport, report: { ...report, id: undefined, serial_number: undefined } });

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add to Patrol' }));
    await userEvent.click(await screen.findByRole('button', { name: /Add to patrol 30/ }));

    expect(onSaveNewReport).toHaveBeenCalled();
    expect(addEventToPatrol).toHaveBeenCalledWith('saved-event-id', 'patrol-id');
  });

  test('links nothing when the user cancels', async () => {
    renderReportMenu();

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add to Patrol' }));
    await screen.findByRole('button', { name: /Add to patrol 30/ });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(addEventToPatrol).not.toHaveBeenCalled();
  });

  test('tells the user when the event could not be added to the patrol', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    addEventToPatrol.mockImplementation(() => () => Promise.reject(new Error('link error')));

    renderReportMenu();

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add to Patrol' }));
    await userEvent.click(await screen.findByRole('button', { name: /Add to patrol 30/ }));

    expect(await screen.findByText('Could not add the event to the patrol. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
