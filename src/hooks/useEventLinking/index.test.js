import { Provider } from 'react-redux';

import { act, renderHook } from '../../test-utils';
import {
  addEventToIncident,
  addEventToPatrol,
  createEvent,
  removeEventFromIncident,
  removeEventFromPatrol,
} from '../../ducks/events';
import { EVENT_LINK_TARGET_TYPES } from '../../constants';
import { mockStore } from '../../__test-helpers/MockStore';
import { showToast } from '../../utils/toast';
import { TrackerContext } from '../../utils/analytics';

import useEventLinking from './';

jest.mock('../../ducks/events', () => ({
  ...jest.requireActual('../../ducks/events'),
  addEventToIncident: jest.fn(),
  addEventToPatrol: jest.fn(),
  createEvent: jest.fn(),
  removeEventFromIncident: jest.fn(),
  removeEventFromPatrol: jest.fn(),
}));

jest.mock('../../utils/toast', () => ({
  ...jest.requireActual('../../utils/toast'),
  showToast: jest.fn(),
}));

describe('useEventLinking', () => {
  const incident = { id: 'incident-id', serial_number: 20 };
  const patrol = { id: 'patrol-id', serial_number: 30 };

  let event;
  let linkedEvent;
  let tracker;

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    addEventToIncident.mockImplementation(() => () => Promise.resolve());
    addEventToPatrol.mockImplementation(() => () => Promise.resolve());
    createEvent.mockImplementation(() => () => Promise.resolve({ data: { data: { id: 'new-incident-id', serial_number: 21 } } }));
    removeEventFromIncident.mockImplementation(() => () => Promise.resolve(incident));
    removeEventFromPatrol.mockImplementation(() => () => Promise.resolve(patrol));
    event = { id: 'event-id', is_contained_in: [], patrols: [], priority: 300, serial_number: 10 };
    linkedEvent = {
      ...event,
      is_contained_in: [{ related_event: { id: 'incident-id' } }],
      patrols: ['patrol-id'],
    };
    tracker = { track: jest.fn() };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderUseEventLinking = () => {
    const store = mockStore({ data: {}, view: {} });

    return renderHook(() => useEventLinking(), {
      wrapper: ({ children }) => <Provider store={store}>
        <TrackerContext.Provider value={tracker}>{children}</TrackerContext.Provider>
      </Provider>,
    });
  };

  test('opens and closes the link modal for an event and a target type', () => {
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL, event));

    expect(result.current.isLinkModalOpen).toBe(true);
    expect(result.current.linkModalEvent).toBe(event);
    expect(result.current.linkModalType).toBe(EVENT_LINK_TARGET_TYPES.PATROL);
    expect(tracker.track).toHaveBeenCalledWith('Open the add to patrol modal');

    act(() => result.current.closeLinkModal());

    expect(result.current.isLinkModalOpen).toBe(false);
    expect(result.current.linkModalType).toBe(EVENT_LINK_TARGET_TYPES.PATROL);
  });

  test('adds the event to the patrol picked in the modal, confirms it and closes the modal', async () => {
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL, event));
    await act(() => result.current.addToLinkTarget(patrol));

    expect(addEventToPatrol).toHaveBeenCalledWith('event-id', 'patrol-id');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Event 10 added to patrol 30.',
      toastConfig: expect.objectContaining({ type: 'success' }),
    }));
    expect(tracker.track).toHaveBeenCalledWith('Add an event to a patrol');
    expect(result.current.isLinkModalOpen).toBe(false);
    expect(result.current.isLinking).toBe(false);
  });

  test('adds the event to the incident picked in the modal', async () => {
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT, event));
    await act(() => result.current.addToLinkTarget(incident));

    expect(addEventToIncident).toHaveBeenCalledWith('event-id', 'incident-id');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Event 10 added to incident 20.' }));
    expect(tracker.track).toHaveBeenCalledWith('Add an event to an existing incident');
  });

  test('creates an incident with the priority of the event and adds the event to it', async () => {
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT, event));
    await act(() => result.current.addToNewIncident());

    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'incident_collection', priority: 300 }));
    expect(addEventToIncident).toHaveBeenCalledWith('event-id', 'new-incident-id');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Event 10 added to new incident 21.' }));
    expect(tracker.track).toHaveBeenCalledWith('Add an event to a new incident');
    expect(result.current.isLinkModalOpen).toBe(false);
  });

  test('adds the event to the incident it already created when the user retries a failed link', async () => {
    addEventToIncident.mockImplementationOnce(() => () => Promise.reject(new Error('link error')));
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT, event));
    await act(() => result.current.addToNewIncident());
    await act(() => result.current.addToNewIncident());

    expect(createEvent).toHaveBeenCalledTimes(1);
    expect(addEventToIncident).toHaveBeenNthCalledWith(2, 'event-id', 'new-incident-id');
    expect(showToast).toHaveBeenLastCalledWith(expect.objectContaining({
      message: 'Event 10 added to new incident 21.',
    }));
  });

  test('creates another incident for another event after a failed link', async () => {
    addEventToIncident.mockImplementationOnce(() => () => Promise.reject(new Error('link error')));
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT, event));
    await act(() => result.current.addToNewIncident());
    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT, { ...event, id: 'other-event-id' }));
    await act(() => result.current.addToNewIncident());

    expect(createEvent).toHaveBeenCalledTimes(2);
  });

  test('creates another incident when the event is added to a new incident again', async () => {
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT, event));
    await act(() => result.current.addToNewIncident());
    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT, event));
    await act(() => result.current.addToNewIncident());

    expect(createEvent).toHaveBeenCalledTimes(2);
  });

  test('keeps the modal open and shows an error when the link fails', async () => {
    addEventToPatrol.mockImplementation(() => () => Promise.reject(new Error('link error')));
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL, event));
    await act(() => result.current.addToLinkTarget(patrol));

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Could not add the event to the patrol. Please try again.',
      toastConfig: expect.objectContaining({ type: 'error' }),
    }));
    expect(tracker.track).toHaveBeenCalledWith('Fail to add an event to a patrol');
    expect(result.current.isLinkModalOpen).toBe(true);
    expect(result.current.isLinking).toBe(false);
  });

  test('flags the event of the link while it is under way', async () => {
    let resolveLink;
    addEventToPatrol.mockImplementation(() => () => new Promise((resolve) => {
      resolveLink = resolve;
    }));
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL, event));
    let linkPromise;
    act(() => {
      linkPromise = result.current.addToLinkTarget(patrol);
    });

    expect(result.current.isLinking).toBe(true);
    expect(result.current.linkingEventIds).toEqual(new Set(['event-id']));

    await act(async () => {
      resolveLink();
      await linkPromise;
    });

    expect(result.current.isLinking).toBe(false);
    expect(result.current.linkingEventIds).toEqual(new Set());
  });

  test('saves a new event before linking the event it saved', async () => {
    const saveEvent = jest.fn(() => Promise.resolve({ id: 'saved-event-id', serial_number: 11 }));
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL, { ...event, id: undefined }, saveEvent));
    await act(() => result.current.addToLinkTarget(patrol));

    expect(saveEvent).toHaveBeenCalled();
    expect(addEventToPatrol).toHaveBeenCalledWith('saved-event-id', 'patrol-id');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Event 11 added to patrol 30.' }));
  });

  test('does not save an event that is already saved', async () => {
    const saveEvent = jest.fn();
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL, event, saveEvent));
    await act(() => result.current.addToLinkTarget(patrol));

    expect(saveEvent).not.toHaveBeenCalled();
    expect(addEventToPatrol).toHaveBeenCalledWith('event-id', 'patrol-id');
  });

  test('closes the modal without linking when the new event could not be saved', async () => {
    const saveEvent = jest.fn(() => Promise.resolve(undefined));
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL, { ...event, id: undefined }, saveEvent));
    await act(() => result.current.addToLinkTarget(patrol));

    expect(addEventToPatrol).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(result.current.isLinkModalOpen).toBe(false);
  });

  test('does not save the event of an earlier modal', async () => {
    const saveEvent = jest.fn();
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL, { ...event, id: undefined }, saveEvent));
    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL, { ...event, id: undefined }));
    await act(() => result.current.addToLinkTarget(patrol));

    expect(saveEvent).not.toHaveBeenCalled();
  });

  test('leaves open the modal of another event that opened while a link ran', async () => {
    let resolveAddEventToIncident;
    addEventToIncident.mockImplementation(() => () => new Promise((resolve) => {
      resolveAddEventToIncident = resolve;
    }));
    const otherEvent = { ...event, id: 'other-event-id', serial_number: 11 };
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT, event));
    let addition;
    act(() => {
      addition = result.current.addToLinkTarget(incident);
    });
    act(() => result.current.closeLinkModal());
    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL, otherEvent));
    await act(async () => {
      resolveAddEventToIncident();
      await addition;
    });

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Event 10 added to incident 20.' }));
    expect(result.current.isLinkModalOpen).toBe(true);
    expect(result.current.linkModalEvent).toBe(otherEvent);
  });

  test('leaves open the modal of another event that opened while a new incident was created', async () => {
    let resolveCreateEvent;
    createEvent.mockImplementation(() => () => new Promise((resolve) => {
      resolveCreateEvent = () => resolve({ data: { data: { id: 'new-incident-id', serial_number: 21 } } });
    }));
    const otherEvent = { ...event, id: 'other-event-id', serial_number: 11 };
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT, event));
    let addition;
    act(() => {
      addition = result.current.addToNewIncident();
    });
    act(() => result.current.closeLinkModal());
    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT, otherEvent));
    await act(async () => {
      resolveCreateEvent();
      await addition;
    });

    expect(addEventToIncident).toHaveBeenCalledWith('event-id', 'new-incident-id');
    expect(result.current.isLinkModalOpen).toBe(true);
  });

  test('removes the event from its incident, confirms it and resolves to true', async () => {
    const { result } = renderUseEventLinking();

    let isRemoved;
    await act(async () => {
      isRemoved = await result.current.removeFromIncident(linkedEvent);
    });

    expect(removeEventFromIncident).toHaveBeenCalledWith('event-id', 'incident-id');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Event 10 removed from incident 20.',
      toastConfig: expect.objectContaining({ type: 'success' }),
    }));
    expect(tracker.track).toHaveBeenCalledWith('Remove an event from an incident');
    expect(isRemoved).toBe(true);
  });

  test('removes the event from the incident it is asked to, of the several that hold it', async () => {
    const { result } = renderUseEventLinking();

    await act(() => result.current.removeFromIncident({
      ...linkedEvent,
      is_contained_in: [...linkedEvent.is_contained_in, { related_event: { id: 'other-incident-id' } }],
    }, 'other-incident-id'));

    expect(removeEventFromIncident).toHaveBeenCalledWith('event-id', 'other-incident-id');
  });

  test('confirms a removal without naming the incident or patrol when it could not be loaded', async () => {
    removeEventFromIncident.mockImplementation(() => () => Promise.resolve(null));
    removeEventFromPatrol.mockImplementation(() => () => Promise.resolve(null));
    const { result } = renderUseEventLinking();

    await act(() => result.current.removeFromIncident(linkedEvent));
    await act(() => result.current.removeFromPatrol(linkedEvent));

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Event 10 removed from the incident.' }));
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Event 10 removed from the patrol.' }));
  });

  test('removes the event from its patrol, confirms it and resolves to true', async () => {
    const { result } = renderUseEventLinking();

    let isRemoved;
    await act(async () => {
      isRemoved = await result.current.removeFromPatrol(linkedEvent);
    });

    expect(removeEventFromPatrol).toHaveBeenCalledWith('event-id', 'patrol-id');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Event 10 removed from patrol 30.' }));
    expect(tracker.track).toHaveBeenCalledWith('Remove an event from a patrol');
    expect(isRemoved).toBe(true);
  });

  test('removes the event from the patrol it is asked to', async () => {
    const { result } = renderUseEventLinking();

    await act(() => result.current.removeFromPatrol({
      ...linkedEvent,
      patrols: [...linkedEvent.patrols, 'other-patrol-id'],
    }, 'other-patrol-id'));

    expect(removeEventFromPatrol).toHaveBeenCalledWith('event-id', 'other-patrol-id');
  });

  test('shows an error and resolves to false when a removal fails', async () => {
    removeEventFromPatrol.mockImplementation(() => () => Promise.reject(new Error('unlink error')));
    const { result } = renderUseEventLinking();

    let isRemoved;
    await act(async () => {
      isRemoved = await result.current.removeFromPatrol(linkedEvent);
    });

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Could not remove the event from the patrol. Please try again.',
      toastConfig: expect.objectContaining({ type: 'error' }),
    }));
    expect(tracker.track).toHaveBeenCalledWith('Fail to remove an event from a patrol');
    expect(isRemoved).toBe(false);
    expect(result.current.linkingEventIds).toEqual(new Set());
  });

  test('flags each event while its removal is under way', async () => {
    const resolveRemovals = [];
    removeEventFromIncident.mockImplementation(() => () => new Promise((resolve) => {
      resolveRemovals.push(resolve);
    }));
    const { result } = renderUseEventLinking();

    let removalPromises;
    act(() => {
      removalPromises = [
        result.current.removeFromIncident(linkedEvent),
        result.current.removeFromIncident({ ...linkedEvent, id: 'other-event-id' }),
      ];
    });

    expect(result.current.linkingEventIds).toEqual(new Set(['event-id', 'other-event-id']));
    expect(result.current.isLinking).toBe(false);

    await act(async () => {
      resolveRemovals[0]();
      await removalPromises[0];
    });

    expect(result.current.linkingEventIds).toEqual(new Set(['other-event-id']));

    await act(async () => {
      resolveRemovals[1]();
      await removalPromises[1];
    });
  });

  test('ignores another change of an event pressed before the first one renders, and resolves it to false', async () => {
    let resolveRemoval;
    removeEventFromIncident.mockImplementation(() => () => new Promise((resolve) => {
      resolveRemoval = resolve;
    }));
    const { result } = renderUseEventLinking();

    let removalPromises;
    act(() => {
      removalPromises = [result.current.removeFromIncident(linkedEvent), result.current.removeFromIncident(linkedEvent)];
    });

    await expect(removalPromises[1]).resolves.toBe(false);

    await act(async () => {
      resolveRemoval(incident);
      await removalPromises[0];
    });

    expect(removeEventFromIncident).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledTimes(1);
  });

  test('keeps the removal handlers the same between renders', () => {
    const { rerender, result } = renderUseEventLinking();
    const firstRenderResult = result.current;

    rerender();

    expect(result.current.openLinkModal).toBe(firstRenderResult.openLinkModal);
    expect(result.current.removeFromIncident).toBe(firstRenderResult.removeFromIncident);
    expect(result.current.removeFromPatrol).toBe(firstRenderResult.removeFromPatrol);
  });
});
