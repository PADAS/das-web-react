import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { useReactToPrint } from 'react-to-print';
import userEvent from '@testing-library/user-event';

import { EVENT_LINK_TARGET_TYPES, PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../../../../constants';
import { eventTypes } from '../../../../../__test-helpers/fixtures/event-types';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { render, screen } from '../../../../../test-utils';
import { report } from '../../../../../__test-helpers/fixtures/reports';
import { TrackerContext } from '../../../../../utils/analytics';

import ReportMenu from './';

jest.mock('react-to-print', () => ({
  ...jest.requireActual('react-to-print'),
  useReactToPrint: jest.fn(),
}));

describe('SideBar - EventsManager - EventOverview - Header - ReportMenu', () => {
  let handlePrint;
  let onOpenLinkModal;
  let onRemoveFromIncident;
  let onRemoveFromPatrol;
  let onSaveNewReport;
  let state;

  beforeEach(() => {
    handlePrint = jest.fn();
    onOpenLinkModal = jest.fn();
    onRemoveFromIncident = jest.fn();
    onRemoveFromPatrol = jest.fn();
    onSaveNewReport = jest.fn();
    useReactToPrint.mockImplementation(() => handlePrint);

    state = {
      data: {
        eventCategories: {},
        eventTypes,
        user: {
          permissions: {
            [PERMISSION_KEYS.EVENT_RELATED_SEGMENTS]: [PERMISSIONS.DELETE],
            [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ, PERMISSIONS.UPDATE],
          },
        },
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
          onOpenLinkModal={onOpenLinkModal}
          onRemoveFromIncident={onRemoveFromIncident}
          onRemoveFromPatrol={onRemoveFromPatrol}
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

  test('offers to add an event whose category the user cannot edit to a patrol, but not to an incident', async () => {
    state.data.eventTypes = eventTypes.map((eventType) => eventType.value === report.event_type
      ? { ...eventType, category: { ...eventType.category, permissions: ['read'] } }
      : eventType);

    renderReportMenu();

    await openMenu();

    expect(screen.queryByRole('menuitem', { name: 'Add to Incident' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Add to Patrol' })).toBeInTheDocument();
  });

  test('opens the modal to add the event to an incident or a patrol', async () => {
    renderReportMenu();

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add to Incident' }));
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add to Patrol' }));

    expect(onOpenLinkModal).toHaveBeenNthCalledWith(1, EVENT_LINK_TARGET_TYPES.INCIDENT, report, null);
    expect(onOpenLinkModal).toHaveBeenNthCalledWith(2, EVENT_LINK_TARGET_TYPES.PATROL, report, null);
  });

  test('hands the modal how to save a new event', async () => {
    const newReport = { ...report, id: undefined, serial_number: undefined };
    renderReportMenu({ onSaveNewReport, report: newReport });

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add to Patrol' }));

    expect(onOpenLinkModal).toHaveBeenCalledWith(EVENT_LINK_TARGET_TYPES.PATROL, newReport, onSaveNewReport);
  });

  test('shows that the links of the event are changing', () => {
    renderReportMenu({ isChangingLinks: true });

    expect(screen.getByRole('button', { name: 'More options' })).toHaveAttribute('aria-busy', 'true');
  });

  describe('removing the event from its links', () => {
    let linkedReport;

    beforeEach(() => {
      linkedReport = { ...report, is_contained_in: [{ related_event: { id: 'incident-id' } }], patrols: ['patrol-id'] };
      state.data.user.permissions[PERMISSION_KEYS.EVENT_RELATIONSHIPS] = [PERMISSIONS.DELETE];
    });

    test('offers to remove the event from its incident and its patrol instead of adding it to others', async () => {
      renderReportMenu({ report: linkedReport });

      await openMenu();

      expect(screen.getByRole('menuitem', { name: 'Remove from Incident' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Remove from Patrol' })).toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'Add to Incident' })).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'Add to Patrol' })).not.toBeInTheDocument();
    });

    test('does not offer to remove the event from its incident without the delete permission', async () => {
      delete state.data.user.permissions[PERMISSION_KEYS.EVENT_RELATIONSHIPS];
      renderReportMenu({ report: linkedReport });

      await openMenu();

      expect(screen.queryByRole('menuitem', { name: 'Remove from Incident' })).not.toBeInTheDocument();
    });

    test('does not offer to remove an event being added from somewhere else', async () => {
      renderReportMenu({ canLinkReport: false, report: linkedReport });

      await openMenu();

      expect(screen.queryByRole('menuitem', { name: 'Remove from Incident' })).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'Remove from Patrol' })).not.toBeInTheDocument();
    });

    test('removes the event from its incident or its patrol at once', async () => {
      renderReportMenu({ report: linkedReport });

      await openMenu();
      await userEvent.click(screen.getByRole('menuitem', { name: 'Remove from Incident' }));
      await openMenu();
      await userEvent.click(screen.getByRole('menuitem', { name: 'Remove from Patrol' }));

      expect(onRemoveFromIncident).toHaveBeenCalledWith(linkedReport);
      expect(onRemoveFromPatrol).toHaveBeenCalledWith(linkedReport);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
