import React from 'react';
import { Provider } from 'react-redux';
import { toast } from 'react-toastify';
import userEvent from '@testing-library/user-event';

import { getReportLink } from '../../../../../utils/events';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { PREVIEW_FEATURES } from '../../../../../constants';
import { render, screen, waitFor } from '../../../../../test-utils';
import { report } from '../../../../../__test-helpers/fixtures/reports';
import { setBounceEventIDs } from '../../../../../ducks/map-ui';
import { setEventState, updateEvent } from '../../../../../ducks/events';
import { showToast } from '../../../../../utils/toast';
import { TrackerContext } from '../../../../../utils/analytics';
import useJumpToLocation from '../../../../../hooks/useJumpToLocation';

import Actions from './';

jest.mock('../../../../../ducks/events', () => ({
  ...jest.requireActual('../../../../../ducks/events'),
  setEventState: jest.fn(),
  updateEvent: jest.fn(),
}));

jest.mock('../../../../../hooks/useJumpToLocation', () => jest.fn());

jest.mock('../../../../../utils/toast', () => ({
  ...jest.requireActual('../../../../../utils/toast'),
  showToast: jest.fn(),
}));

describe('SideBar - EventsManager - EventsFeed - EventRow - Actions', () => {
  const coordinates = report.geojson.geometry.coordinates;

  let collection;
  let jumpToLocation;
  let reduxStore;
  let store;
  let track;

  beforeEach(() => {
    jumpToLocation = jest.fn();
    track = jest.fn();
    setEventState.mockImplementation(() => () => Promise.resolve());
    updateEvent.mockImplementation(() => () => Promise.resolve());
    useJumpToLocation.mockImplementation(() => jumpToLocation);

    collection = {
      ...report,
      contains: [
        { related_event: { id: 'contained-event-1', serial_number: 1 } },
        { related_event: { id: 'contained-event-2', serial_number: 2 } },
      ],
      is_collection: true,
    };
    store = { data: {}, view: { systemConfig: { previewFeatures: {} } } };
  });

  const renderActions = (props) => {
    reduxStore = mockStore(store);

    return render(
      <Provider store={reduxStore}>
        <TrackerContext.Provider value={{ track }}>
          <Actions coordinates={coordinates} event={report} {...props} />
        </TrackerContext.Provider>
      </Provider>
    );
  };

  const openKebabMenu = () => userEvent.click(screen.getByRole('button', { name: 'More options' }));

  const getStateOptionNames = async () => {
    await openKebabMenu();

    const options = await screen.findAllByRole('menuitem');

    return options
      .map((option) => option.textContent)
      .filter((optionName) => !['Jump to location', 'Copy event link'].includes(optionName));
  };

  test('enables the jump to location button when the event has coordinates', () => {
    renderActions();

    expect(screen.getByRole('button', { name: 'Jump to location' })).toBeEnabled();
  });

  test('shows a single marker on the jump to location button of an event', () => {
    renderActions();

    expect(screen.getByRole('button', { name: 'Jump to location' }).querySelectorAll('svg')).toHaveLength(1);
  });

  test('shows two markers on the jump to location button of a collection with several locations', () => {
    renderActions({
      event: {
        ...collection,
        contains: [
          { related_event: { geojson: { geometry: { coordinates: [1, 2], type: 'Point' } }, id: 'contained-event-1' } },
          { related_event: { geojson: { geometry: { coordinates: [3, 4], type: 'Point' } }, id: 'contained-event-2' } },
        ],
      },
    });

    expect(screen.getByRole('button', { name: 'Jump to location' }).querySelectorAll('svg')).toHaveLength(2);
  });

  test('disables the jump to location button when the event has no coordinates', () => {
    renderActions({ coordinates: undefined });

    expect(screen.getByRole('button', { name: 'Jump to location' })).toBeDisabled();
  });

  test('disables the jump to location button when the event coordinates are empty', () => {
    renderActions({ coordinates: [] });

    expect(screen.getByRole('button', { name: 'Jump to location' })).toBeDisabled();
  });

  test('jumps to the event coordinates without bouncing it on the first click', async () => {
    renderActions();

    await userEvent.click(screen.getByRole('button', { name: 'Jump to location' }));

    expect(jumpToLocation).toHaveBeenCalledWith(coordinates);
    expect(reduxStore.getActions()).toEqual([]);
    expect(track).toHaveBeenCalledWith(
      'Click "jump to location" from the events feed',
      `Event Type:${report.event_type}`
    );
  });

  test('bounces the event when the user jumps to its location again', async () => {
    renderActions();

    await userEvent.click(screen.getByRole('button', { name: 'Jump to location' }));
    await userEvent.click(screen.getByRole('button', { name: 'Jump to location' }));

    expect(jumpToLocation).toHaveBeenCalledTimes(2);
    expect(reduxStore.getActions()).toContainEqual(setBounceEventIDs([]));
    await waitFor(() => expect(reduxStore.getActions()).toContainEqual(setBounceEventIDs([report.id])));
  });

  test('bounces the contained events when the user jumps to the location of a collection again', async () => {
    renderActions({ event: collection });

    await userEvent.click(screen.getByRole('button', { name: 'Jump to location' }));
    await userEvent.click(screen.getByRole('button', { name: 'Jump to location' }));

    await waitFor(() => {
      expect(reduxStore.getActions())
        .toContainEqual(setBounceEventIDs(['contained-event-1', 'contained-event-2']));
    });
  });

  test('offers to resolve an active event', async () => {
    renderActions();

    expect(await getStateOptionNames()).toEqual(['Resolve']);
  });

  test('offers to resolve a legacy new event', async () => {
    renderActions({ event: { ...report, state: 'new' } });

    expect(await getStateOptionNames()).toEqual(['Resolve']);
  });

  test('offers to send an active event to review when community input is enabled', async () => {
    store.view.systemConfig.previewFeatures[PREVIEW_FEATURES.COMMUNITY_INPUT_ADMIN] = true;

    renderActions();

    expect(await getStateOptionNames()).toEqual(['Resolve', 'Send to review']);
  });

  test('offers to resolve or activate an event in review', async () => {
    renderActions({ event: { ...report, state: 'review' } });

    expect(await getStateOptionNames()).toEqual(['Resolve', 'Activate']);
  });

  test('offers to reopen a resolved event', async () => {
    store.view.systemConfig.previewFeatures[PREVIEW_FEATURES.COMMUNITY_INPUT_ADMIN] = true;

    renderActions({ event: { ...report, state: 'resolved' } });

    expect(await getStateOptionNames()).toEqual(['Reopen']);
  });

  test('updates the event state and confirms it when the user picks a state', async () => {
    renderActions();

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Resolve' }));

    expect(updateEvent).toHaveBeenCalledWith({ id: report.id, state: 'resolved' });
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: `#${report.serial_number} resolved` }));
    });
    expect(track).toHaveBeenCalledWith('Pick the "resolved" event state from the events feed');
  });

  test('reopens a resolved event as active', async () => {
    renderActions({ event: { ...report, state: 'resolved' } });

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Reopen' }));

    expect(updateEvent).toHaveBeenCalledWith({ id: report.id, state: 'active' });
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: `#${report.serial_number} active` }));
    });
  });

  test('marks the menu busy while the state update is pending', async () => {
    let resolveUpdate;
    updateEvent.mockImplementation(() => () => new Promise((resolve) => {
      resolveUpdate = resolve;
    }));

    renderActions();

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Resolve' }));

    const kebabMenuButton = screen.getByRole('button', { name: 'More options' });

    expect(kebabMenuButton).toHaveAttribute('aria-busy', 'true');

    resolveUpdate();

    await waitFor(() => expect(kebabMenuButton).toHaveAttribute('aria-busy', 'false'));
  });

  test('updates every contained event when the user picks a state for a collection', async () => {
    renderActions({ event: collection });

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Resolve' }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
        message: `The collection #${report.serial_number} was resolved correctly`,
      }));
    });
    expect(updateEvent).toHaveBeenCalledWith({ id: report.id, state: 'resolved' });
    expect(setEventState).toHaveBeenCalledTimes(2);
    expect(setEventState).toHaveBeenCalledWith('contained-event-1', 'resolved');
    expect(setEventState).toHaveBeenCalledWith('contained-event-2', 'resolved');
  });

  test('reports which contained events could not be updated', async () => {
    setEventState.mockImplementation((id) => () => id === 'contained-event-2'
      ? Promise.reject(new Error('Contained event update error'))
      : Promise.resolve());

    renderActions({ event: collection });

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Resolve' }));

    await waitFor(() => expect(showToast).toHaveBeenCalled());
    expect(showToast.mock.calls[0][0].details.props.processedEvents)
      .toEqual([expect.objectContaining({ id: 'contained-event-1' })]);
    expect(showToast.mock.calls[0][0].details.props.failedEvents)
      .toEqual([expect.objectContaining({ id: 'contained-event-2' })]);
  });

  test('shows an error toast when the event state could not be updated', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    updateEvent.mockImplementation(() => () => Promise.reject(new Error('Event update error')));

    renderActions();

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Resolve' }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
        message: `#${report.serial_number} still active, something went wrong`,
        toastConfig: expect.objectContaining({ type: 'error' }),
      }));
    });
    expect(screen.getByRole('button', { name: 'More options' })).toHaveAttribute('aria-busy', 'false');
  });

  test('copies the event link and confirms it', async () => {
    jest.spyOn(toast, 'info').mockImplementation(() => {});
    window.navigator.clipboard = { writeText: jest.fn().mockResolvedValue() };

    renderActions();

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Copy event link' }));

    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(getReportLink(report));
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('Link copied', expect.anything()));
    expect(track).toHaveBeenCalledWith('Copy event link from the events feed');
  });
});
