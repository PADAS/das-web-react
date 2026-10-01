import React from 'react';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { useReactToPrint } from 'react-to-print';
import userEvent from '@testing-library/user-event';

import { addEventToIncident, createEvent, fetchEvent } from '../../../../../ducks/events';
import { addModal } from '../../../../../ducks/modals';
import { addPatrolSegmentToEvent } from '../../../../../utils/events';
import { eventTypes } from '../../../../../__test-helpers/fixtures/event-types';
import patrolTypes from '../../../../../__test-helpers/fixtures/patrol-types';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import NavigationWrapper from '../../../../../__test-helpers/navigationWrapper';
import { act, render, screen, waitFor } from '../../../../../test-utils';
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
  createEvent: jest.fn(),
  fetchEvent: jest.fn(),
}));

jest.mock('../../../../../utils/events', () => ({
  ...jest.requireActual('../../../../../utils/events'),
  addPatrolSegmentToEvent: jest.fn(),
}));

jest.mock('../../../../../ducks/modals', () => ({
  ...jest.requireActual('../../../../../ducks/modals'),
  addModal: jest.fn(),
}));

describe('Menu report options', () => {
  const handlePrint = jest.fn();
  const onSaveReport = jest.fn();
  const setRedirectTo = jest.fn();
  let addModalMock, store, Wrapper, renderWithWrapper, useReactToPrintMock;

  beforeEach(() => {
    addModalMock = jest.fn(() => () => {});
    addModal.mockImplementation(addModalMock);
    addEventToIncident.mockImplementation(() => () => Promise.resolve());
    addPatrolSegmentToEvent.mockImplementation(() => Promise.resolve());
    createEvent.mockImplementation(() => () => Promise.resolve({ data: { data: { id: 'new-incident' } } }));
    fetchEvent.mockImplementation((eventId) => () => Promise.resolve({ data: { data: { id: eventId } } }));
    onSaveReport.mockImplementation(() => Promise.resolve([{ data: { data: { id: 'saved-event' } } }]));
    useReactToPrintMock = jest.fn(() => handlePrint);
    useReactToPrint.mockImplementation(useReactToPrintMock);

    store = mockStore({
      data: {
        eventTypes,
        patrolTypes,
      },
    });
  });

  Wrapper = ({ children }) => /* eslint-disable-line react/display-name */
    <Provider store={store}>
      <NavigationWrapper>
        <TrackerContext.Provider value={{ track: jest.fn() }}>
          {children}
        </TrackerContext.Provider>
      </NavigationWrapper>
    </Provider>;

  renderWithWrapper = (Component) => render(Component, { wrapper: Wrapper });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('copies the report link when the user clicks the copy report link button', async () => {
    const writeText = jest.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
    });

    renderWithWrapper(<>
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={report}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
      <ToastContainer />
    </>);

    const kebabButton = screen.getByRole('button');
    await userEvent.click(kebabButton);

    expect(writeText).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('menuitem', { name: 'Copy Event Link' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith(
        'http://localhost/events/d45cb504-4612-41fe-9ea5-f1b423ac3ba4?lnglat=-104.19557197413907,20.75709101172957'
      );
      expect(screen.getByText('Link copied')).toBeDefined();
    });
  });

  test('prints the report when the user clicks Print Report button', async () => {
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={report}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
    );

    const kebabButton = await screen.getByRole('button');
    await userEvent.click(kebabButton);

    expect(handlePrint).toHaveBeenCalledTimes(0);

    const printReportButton = await screen.getByText('Print Event Details');
    await userEvent.click(printReportButton);

    expect(handlePrint).toHaveBeenCalledTimes(1);
  });

  test('should not show the incident option if the report is a collection', async () => {
    const collectionReport = { ...report, ...{ is_collection: true } };
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={collectionReport}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
    );

    const kebabButton = screen.getByRole('button');
    await userEvent.click(kebabButton);

    expect((screen.queryByText('Add to Incident'))).toBeNull();
    expect((screen.queryByText('Add to Parol'))).toBeDefined();
  });

  test('should not show the incident option if the report belongs to a collection', async () => {
    const reportWithCollection = { ...report, ...{ is_contained_in: [{ type: 'contains', ordernum: null, url: 'https://fake.com', related_event: {} }] } };
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={reportWithCollection}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
    );

    const kebabButton = screen.getByRole('button');
    await userEvent.click(kebabButton);

    expect((screen.queryByText('Add to Incident'))).toBeNull();
    expect((screen.queryByText('Add to Parol'))).toBeDefined();
  });

  test('shows the add to incident option and shows the incident modal when clicking it', async () => {
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={report}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
    );

    const kebabButton = await screen.getByRole('button');
    await userEvent.click(kebabButton);

    const addToIncidentButton = await screen.findByText('Add to Incident');

    expect(addToIncidentButton).toBeDefined();

    await userEvent.click(addToIncidentButton);

    expect(addModal).toHaveBeenCalledTimes(1);
  });

  const renderReportMenuAndPick = async (optionName) => {
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={report}
        setRedirectTo={setRedirectTo}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    await userEvent.click(screen.getByRole('menuitem', { name: optionName }));

    return addModal.mock.calls.at(-1)[0];
  };

  test('saves the event into the incident the user picks, then opens the incident', async () => {
    const modal = await renderReportMenuAndPick('Add to Incident');

    await act(() => modal.onAddToExistingIncident({ id: 'incident' }));

    expect(onSaveReport).toHaveBeenCalledWith(undefined, false);
    expect(addEventToIncident).toHaveBeenCalledWith('saved-event', 'incident');
    await waitFor(() => {
      expect(setRedirectTo).toHaveBeenCalledWith('/events/incident');
    });
  });

  test('creates an incident for the event when the user picks a new one', async () => {
    const modal = await renderReportMenuAndPick('Add to Incident');

    await act(() => modal.onAddToNewIncident());

    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'incident_collection' }));
    expect(addEventToIncident).toHaveBeenCalledWith('saved-event', 'new-incident');
    await waitFor(() => {
      expect(setRedirectTo).toHaveBeenCalledWith('/events/new-incident');
    });
  });

  test('saves the event into the running leg of the patrol the user picks, then opens the patrol', async () => {
    const modal = await renderReportMenuAndPick('Add to Patrol');

    await act(() => modal.onAddToPatrol({
      id: 'patrol',
      patrol_segments: [
        { id: 'first-leg', time_range: { end_time: '2026-01-01T10:00:00Z', start_time: '2026-01-01T08:00:00Z' } },
        { id: 'running-leg', time_range: { end_time: null, start_time: '2026-01-01T10:00:00Z' } },
      ],
    }));

    expect(addPatrolSegmentToEvent).toHaveBeenCalledWith('running-leg', 'saved-event');
    await waitFor(() => {
      expect(setRedirectTo).toHaveBeenCalledWith('/patrols/patrol');
    });
  });

  test('does not save the event into a patrol without legs', async () => {
    const modal = await renderReportMenuAndPick('Add to Patrol');

    await act(() => modal.onAddToPatrol({ id: 'patrol', patrol_segments: [] }));

    expect(onSaveReport).not.toHaveBeenCalled();
  });

  test('should not show the patrol option if the report belongs to a patrol', async () => {
    const patrolReport = { ...report, ...{ patrol_segments: [{}] } };
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={patrolReport}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
    );

    const kebabButton = screen.getByRole('button');
    await userEvent.click(kebabButton);

    expect((screen.queryByText('Add to Incident'))).toBeDefined();
    expect((screen.queryByText('Add to Patrol'))).toBeNull();
  });

  test('shows the add to patrol option and shows the patrol modal when clicking it', async () => {
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={report}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
    );

    const kebabButton = await screen.getByRole('button');
    await userEvent.click(kebabButton);

    const addToPatrolButton = await screen.findByText('Add to Patrol');

    expect(addToPatrolButton).toBeDefined();

    await userEvent.click(addToPatrolButton);

    expect(addModal).toHaveBeenCalledTimes(1);
  });

  test('jumps to the location of the event from its mobile option', async () => {
    const onJumpToLocation = jest.fn();

    renderWithWrapper(<ReportMenu
      hasLocation
      onJumpToLocation={onJumpToLocation}
      onSaveReport={onSaveReport}
      printableContentRef={{ current: null }}
      report={report}
      setRedirectTo={setRedirectTo}
    />);

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Jump to location' }));

    expect(onJumpToLocation).toHaveBeenCalled();
  });

  test('disables the jump to location option of an event without a location', async () => {
    renderWithWrapper(<ReportMenu
      hasLocation={false}
      onJumpToLocation={jest.fn()}
      onSaveReport={onSaveReport}
      printableContentRef={{ current: null }}
      report={report}
      setRedirectTo={setRedirectTo}
    />);

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));

    expect(screen.getByRole('menuitem', { name: 'Jump to location' })).toBeDisabled();
  });
});
