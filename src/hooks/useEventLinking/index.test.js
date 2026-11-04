import { Provider } from 'react-redux';

import { act, renderHook } from '../../test-utils';
import { addEventToIncident, addEventToPatrol, createEvent } from '../../ducks/events';
import {
  EVENT_LINK_TARGET_TYPES,
  PERMISSION_KEYS,
  PERMISSIONS,
  SYSTEM_CONFIG_FLAGS,
} from '../../constants';
import { mockStore } from '../../__test-helpers/MockStore';
import { showToast } from '../../utils/toast';
import { snareTypeV1 } from '../../__test-helpers/fixtures/event-types';
import { TrackerContext } from '../../utils/analytics';

import useEventLinking from './';

jest.mock('../../ducks/events', () => ({
  ...jest.requireActual('../../ducks/events'),
  addEventToIncident: jest.fn(),
  addEventToPatrol: jest.fn(),
  createEvent: jest.fn(),
}));

jest.mock('../../utils/toast', () => ({
  ...jest.requireActual('../../utils/toast'),
  showToast: jest.fn(),
}));

describe('useEventLinking', () => {
  const ALL_CATEGORY_PERMISSIONS = ['create', 'read', 'update', 'delete'];

  const incident = { id: 'incident-id', serial_number: 20 };
  const patrol = { id: 'patrol-id', serial_number: 30 };

  let event;
  let state;
  let track;

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    addEventToIncident.mockImplementation(() => () => Promise.resolve());
    addEventToPatrol.mockImplementation(() => () => Promise.resolve());
    createEvent.mockImplementation(() => () => Promise.resolve({ data: { data: { id: 'new-incident-id', serial_number: 21 } } }));
    event = {
      event_type: snareTypeV1.value,
      id: 'event-id',
      is_collection: false,
      is_contained_in: [],
      patrols: [],
      priority: 300,
      serial_number: 10,
    };
    state = {
      data: {
        eventCategories: {},
        eventTypes: [
          { ...snareTypeV1, category: { ...snareTypeV1.category, permissions: ALL_CATEGORY_PERMISSIONS }, version: 1 },
          {
            category: { flag: 'user', permissions: ALL_CATEGORY_PERMISSIONS, value: 'security' },
            is_collection: true,
            value: 'incident_collection',
            version: 1,
          },
        ],
        user: {
          permissions: {
            [PERMISSION_KEYS.EVENT_RELATIONSHIPS]: [PERMISSIONS.DELETE],
            [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ],
          },
        },
      },
      view: { systemConfig: { [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true } },
    };
    track = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderUseEventLinking = (options) => renderHook(() => useEventLinking(event, options), {
    wrapper: ({ children }) => <Provider store={mockStore(state)}>
      <TrackerContext.Provider value={{ track }}>{children}</TrackerContext.Provider>
    </Provider>,
  });

  const setEventCategoryPermissions = (permissions) => {
    state.data.eventTypes[0] = { ...state.data.eventTypes[0], category: { flag: 'user', permissions } };
  };

  test('opens and closes the link modal for a target type', () => {
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL));

    expect(result.current.isLinkModalOpen).toBe(true);
    expect(result.current.linkModalType).toBe(EVENT_LINK_TARGET_TYPES.PATROL);
    expect(track).toHaveBeenCalledWith('Open the add to patrol modal');

    act(() => result.current.closeLinkModal());

    expect(result.current.isLinkModalOpen).toBe(false);
    expect(result.current.linkModalType).toBe(EVENT_LINK_TARGET_TYPES.PATROL);
  });

  test('adds the event to the patrol picked in the modal, confirms it and closes the modal', async () => {
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL));
    await act(() => result.current.addToLinkTarget(patrol));

    expect(addEventToPatrol).toHaveBeenCalledWith('event-id', 'patrol-id');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Event 10 added to patrol 30.',
      toastConfig: expect.objectContaining({ type: 'success' }),
    }));
    expect(track).toHaveBeenCalledWith('Add an event to a patrol');
    expect(result.current.isLinkModalOpen).toBe(false);
    expect(result.current.isLinking).toBe(false);
  });

  test('adds the event to the incident picked in the modal', async () => {
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT));
    await act(() => result.current.addToLinkTarget(incident));

    expect(addEventToIncident).toHaveBeenCalledWith('event-id', 'incident-id');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Event 10 added to incident 20.' }));
    expect(track).toHaveBeenCalledWith('Add an event to an existing incident');
  });

  test('creates an incident with the priority of the event and adds the event to it', async () => {
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT));
    await act(() => result.current.addToNewIncident());

    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'incident_collection', priority: 300 }));
    expect(addEventToIncident).toHaveBeenCalledWith('event-id', 'new-incident-id');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Event 10 added to new incident 21.' }));
    expect(track).toHaveBeenCalledWith('Add an event to a new incident');
  });

  test('keeps the modal open and shows an error when the link fails', async () => {
    addEventToPatrol.mockImplementation(() => () => Promise.reject(new Error('link error')));
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL));
    await act(() => result.current.addToLinkTarget(patrol));

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Could not add the event to the patrol. Please try again.',
      toastConfig: expect.objectContaining({ type: 'error' }),
    }));
    expect(track).toHaveBeenCalledWith('Fail to add an event to a patrol');
    expect(result.current.isLinkModalOpen).toBe(true);
    expect(result.current.isLinking).toBe(false);
  });

  test('flags the link while it is under way', async () => {
    let resolveLink;
    addEventToPatrol.mockImplementation(() => () => new Promise((resolve) => {
      resolveLink = resolve;
    }));
    const { result } = renderUseEventLinking();

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL));
    let linkPromise;
    act(() => {
      linkPromise = result.current.addToLinkTarget(patrol);
    });

    expect(result.current.isLinking).toBe(true);

    await act(async () => {
      resolveLink();
      await linkPromise;
    });

    expect(result.current.isLinking).toBe(false);
  });

  test('saves a new event before linking the event it saved', async () => {
    const saveEvent = jest.fn(() => Promise.resolve({ id: 'saved-event-id', serial_number: 11 }));
    const { result } = renderUseEventLinking({ saveEvent });

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL));
    await act(() => result.current.addToLinkTarget(patrol));

    expect(saveEvent).toHaveBeenCalled();
    expect(addEventToPatrol).toHaveBeenCalledWith('saved-event-id', 'patrol-id');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Event 11 added to patrol 30.' }));
  });

  test('closes the modal without linking when the new event could not be saved', async () => {
    const saveEvent = jest.fn(() => Promise.resolve(undefined));
    const { result } = renderUseEventLinking({ saveEvent });

    act(() => result.current.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL));
    await act(() => result.current.addToLinkTarget(patrol));

    expect(addEventToPatrol).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(result.current.isLinkModalOpen).toBe(false);
  });

  test('lets the user add an unlinked event they can edit to a patrol and to an incident', () => {
    const { result } = renderUseEventLinking();

    expect(result.current.permissions).toEqual({
      canAddToIncident: true,
      canAddToPatrol: true,
      canCreateIncident: true,
      canRemoveFromIncident: false,
    });
  });

  test('offers to remove an event from the incident it belongs to instead of adding it to a patrol or an incident', () => {
    event = { ...event, is_contained_in: [{ related_event: { id: 'incident-id' } }], patrols: ['patrol-id'] };

    const { result } = renderUseEventLinking();

    expect(result.current.permissions).toEqual({
      canAddToIncident: false,
      canAddToPatrol: false,
      canCreateIncident: true,
      canRemoveFromIncident: true,
    });
  });

  test('does not let the user link an event whose category they cannot edit', () => {
    setEventCategoryPermissions(['read']);

    const { result } = renderUseEventLinking();

    expect(result.current.permissions.canAddToIncident).toBe(false);
    expect(result.current.permissions.canAddToPatrol).toBe(false);
  });

  test('does not let the user remove an event from an incident without the delete permission', () => {
    event = { ...event, is_contained_in: [{ related_event: { id: 'incident-id' } }], patrols: ['patrol-id'] };
    state.data.user.permissions = { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ] };

    const { result } = renderUseEventLinking();

    expect(result.current.permissions.canRemoveFromIncident).toBe(false);
  });

  test('does not offer patrols when patrol management is off', () => {
    state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT] = false;

    const { result } = renderUseEventLinking();

    expect(result.current.permissions.canAddToPatrol).toBe(false);
  });

  test('does not offer patrols to a user who cannot read them', () => {
    state.data.user.permissions = {};

    const { result } = renderUseEventLinking();

    expect(result.current.permissions.canAddToPatrol).toBe(false);
  });

  test('does not let the user add an incident to another incident', () => {
    event = { ...event, is_collection: true };

    const { result } = renderUseEventLinking();

    expect(result.current.permissions.canAddToIncident).toBe(false);
  });

  test('does not let the user create an incident without the right to create one', () => {
    state.data.eventTypes[1] = { ...state.data.eventTypes[1], category: { flag: 'user', permissions: ['update'] } };

    const { result } = renderUseEventLinking();

    expect(result.current.permissions.canCreateIncident).toBe(false);
  });

  test('reads the permissions of the active profile', () => {
    state.data.selectedUserProfile = { id: 'profile-id', permissions: {} };

    const { result } = renderUseEventLinking();

    expect(result.current.permissions.canAddToPatrol).toBe(false);
  });
});
