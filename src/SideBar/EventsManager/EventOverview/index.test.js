import React, { useContext, useEffect } from 'react';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import { useLocation, useSearchParams } from 'react-router';

import AddItemButton from '../../../AddItemButton';
import { eventSchemas } from '../../../__test-helpers/fixtures/event-schemas';
import { eventTypes } from '../../../__test-helpers/fixtures/event-types';
import { eventWithPoint } from '../../../__test-helpers/fixtures/events';
import { EVENT_API_URL } from '../../../ducks/events';
import { EVENT_TYPE_SCHEMA_V1_URL } from '../../../ducks/event-schemas';
import { GPS_FORMATS } from '../../../utils/location';
import { mockStore } from '../../../__test-helpers/MockStore';
import { NavigationContext } from '../../../NavigationContextProvider';
import patrolTypes from '../../../__test-helpers/fixtures/patrol-types';
import { render, screen, waitFor, within } from '../../../test-utils';
import EventOverview from './';
import useNavigate from '../../../hooks/useNavigate';
import { SidebarScrollProvider } from '../../../SidebarScrollContext';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('../../../AddItemButton', () => jest.fn());

jest.mock('../../../hooks/useNavigate', () => jest.fn());

const server = setupServer(
  http.get(EVENT_TYPE_SCHEMA_V1_URL(':name'), () => HttpResponse.json( { data: { results: {} } })),
  http.get(`${EVENT_API_URL}:id`, () => HttpResponse.json({ data: eventWithPoint }))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SideBar - EventsManager - EventOverview', () => {
  let AddItemButtonMock, builtStore, navigate, useNavigateMock, store, useLocationMock, useSearchParamsMock;

  beforeEach(() => {
    AddItemButtonMock = jest.fn(() => null);
    AddItemButton.mockImplementation(AddItemButtonMock);
    useLocationMock = jest.fn(() => ({ pathname: '/events/new', state: { temporalId: '1234' } }),);
    useLocation.mockImplementation(useLocationMock);
    useSearchParamsMock = jest.fn(() => ([new URLSearchParams({
      reportType: 'd0884b8c-4ecb-45da-841d-f2f8d6246abf',
    })]));
    useSearchParams.mockImplementation(useSearchParamsMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    store = {
      data: {
        subjectStore: {},
        eventStore: {},
        eventTypes,
        patrolTypes,
        eventSchemas,
        patrolStore: {},
      },
      view: {
        coordinateReferenceSystems: {
          storedSystems: [],
        },
        mapLocationSelection: { isPickingLocation: false },
        sideBar: {},
        systemConfig: {
          previewFeatures: { community_input_admin_enabled: true },
        },
        userPreferences: { gpsFormat: GPS_FORMATS.DEG },
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const NavigationDataSetter = ({ navigationData }) => {
    const { setNavigationData } = useContext(NavigationContext);

    useEffect(() => {
      setNavigationData(navigationData);
    }, [navigationData, setNavigationData]);

    return null;
  };

  const renderEventOverview = (store, navigationData = null) => {
    builtStore = mockStore(store);

    return render(<Provider store={builtStore}>
      <SidebarScrollProvider>
        {!!navigationData && <NavigationDataSetter navigationData={navigationData} />}

        <EventOverview />
      </SidebarScrollProvider>
    </Provider>);
  };

  const PATROL_FLOW_NAVIGATION_DATA = {
    formProps: { parentCrumbs: [{ label: 'Delta Patrol', to: '/patrols/1' }] },
  };

  test('redirects to /events if user tries to create a new report with an invalid reportType', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/events/new', state: {} }),);
    useLocation.mockImplementation(useLocationMock);
    useSearchParamsMock = jest.fn(() => ([new URLSearchParams({ reportType: 'invalid' })]));
    useSearchParams.mockImplementation(useSearchParamsMock);

    renderEventOverview(store);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/events', { replace: true });
    });
  });

  test('redirects to the same route assigning a temporal id in case it is missing', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/events/new', search: '?reportType=1234', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    renderEventOverview(store);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalled();
      expect(navigate.mock.calls[0][0]).toBe('/events/new?reportType=1234');
      expect(navigate.mock.calls[0][1]).toHaveProperty('replace');
      expect(navigate.mock.calls[0][1]).toHaveProperty('state');
      expect(navigate.mock.calls[0][1].state).toHaveProperty('temporalId');
    });
  });

  test('fetches the event data if there is an id specified in the URL and the event is not in the store', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events/123' })));
    useLocation.mockImplementation(useLocationMock);

    renderEventOverview(store);

    const actions = builtStore.getActions();

    await waitFor(() => {
      expect(actions[0].type).toBe('UPDATE_EVENT_STORE');
    });
  });

  test('fetches the event data if there is an id specified in the URL and the event is in the store but is missing properties', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events/123' })));
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = {
      123: {
        ...eventWithPoint,
        updates: undefined,
      },
    };
    renderEventOverview(store);

    const actions = builtStore.getActions();

    await waitFor(() => {
      expect(actions[0].type).toBe('UPDATE_EVENT_STORE');
    });
  });

  test('does not fetch the event data if the id is "new"', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events/new' })));
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 123: eventWithPoint };
    renderEventOverview(store);

    const actions = builtStore.getActions();

    await waitFor(() => {
      expect(actions.find((action) => action.type === 'UPDATE_EVENT_STORE')).not.toBeDefined();
    });
  });

  test('does not fetch the event data if it is in the event store already and complete', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events/123' })));
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 123: eventWithPoint };
    renderEventOverview(store);

    const actions = builtStore.getActions();

    await waitFor(() => {
      expect(actions.find((action) => action.type === 'UPDATE_EVENT_STORE')).not.toBeDefined();
    });
  });

  test('leads a new event back through the crumbs of the flow adding it', async () => {
    renderEventOverview(store, PATROL_FLOW_NAVIGATION_DATA);

    const breadcrumb = await screen.findByRole('navigation', { name: 'Event navigation' });

    expect(await within(breadcrumb).findByRole('link', { name: 'Delta Patrol' })).toHaveAttribute('href', '/patrols/1');
  });

  test('does not apply the form props of an abandoned flow to an existing event', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events/123' })));
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 123: eventWithPoint };
    renderEventOverview(store, PATROL_FLOW_NAVIGATION_DATA);

    const breadcrumb = await screen.findByRole('navigation', { name: 'Event navigation' });

    expect(within(breadcrumb).getByRole('link', { name: 'Events' })).toHaveAttribute('href', '/events');
    expect(within(breadcrumb).queryByRole('link', { name: 'Delta Patrol' })).toBeNull();
  });

  test('shows the added report when clicking the add report button', async () => {
    AddItemButtonMock = ({ onAddReport }) => { /* eslint-disable-line react/display-name */
      useEffect(() => {
        onAddReport({}, {}, 'd0884b8c-4ecb-45da-841d-f2f8d6246abf');
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null;
    };
    AddItemButton.mockImplementation(AddItemButtonMock);

    renderEventOverview(store);

    const addedEventOverview = (await screen.findAllByTestId('reportManagerContainer'))[1];

    await waitFor(() => {
      expect(addedEventOverview).toHaveClass('show');
    });
  });
});
