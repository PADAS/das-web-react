import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation, useSearchParams } from 'react-router-dom';

import AddButton from '../AddButton';
import { eventSchemas } from '../__test-helpers/fixtures/event-schemas';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { eventWithPoint } from '../__test-helpers/fixtures/events';
import { EVENT_API_URL } from '../ducks/events';
import { EVENT_TYPE_SCHEMA_API_URL } from '../ducks/event-schemas';
import { GPS_FORMATS } from '../utils/location';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import ReportManager from './';
import useNavigate from '../hooks/useNavigate';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('../AddButton', () => jest.fn());

jest.mock('../hooks/useNavigate', () => jest.fn());

const server = setupServer(
  rest.get(
    `${EVENT_TYPE_SCHEMA_API_URL}:name`,
    (req, res, ctx) => res(ctx.json( { data: { results: {} } }))
  ),
  rest.get(
    `${EVENT_API_URL}:id`,
    (req, res, ctx) => res(ctx.json({ data: eventWithPoint }))
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ReportManager', () => {
  let capturedRequestURLs;
  const logRequest = (req) => {
    capturedRequestURLs = [...capturedRequestURLs, req.url.toString()];
  };

  let AddButtonMock, navigate, useNavigateMock, store, useLocationMock, useSearchParamsMock;

  beforeEach(() => {
    capturedRequestURLs = [];
    AddButtonMock = jest.fn(() => null);
    AddButton.mockImplementation(AddButtonMock);
    useLocationMock = jest.fn(() => ({ pathname: '/reports/new', state: { temporalId: '1234' } }),);
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
        featureFlagOverrides: {},
        mapLocationSelection: { isPickingLocation: false },
        sideBar: {},
        userPreferences: { gpsFormat: GPS_FORMATS.DEG },
      },
    };
  });

  server.events.on('request:match', (req) => logRequest(req));

  afterEach(() => {
    jest.restoreAllMocks();
    server.events.removeListener('request:match', logRequest);
  });

  test('redirects to /reports if user tries to create a new report with an invalid reportType', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/new', state: {} }),);
    useLocation.mockImplementation(useLocationMock);
    useSearchParamsMock = jest.fn(() => ([new URLSearchParams({ reportType: 'invalid' })]));
    useSearchParams.mockImplementation(useSearchParamsMock);

    render(<Provider store={mockStore(store)}>
      <NavigationWrapper>
        <ReportManager />
      </NavigationWrapper>
    </Provider>);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/reports', { replace: true });
    });
  });

  test('redirects to the same route assigning a temporal id in case it is missing', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/new', search: '?reportType=1234', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportManager />
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalled();
      expect(navigate.mock.calls[0][0]).toBe('/reports/new?reportType=1234');
      expect(navigate.mock.calls[0][1]).toHaveProperty('replace');
      expect(navigate.mock.calls[0][1]).toHaveProperty('state');
      expect(navigate.mock.calls[0][1].state).toHaveProperty('temporalId');
    });
  });

  test('fetches the event data if there is an id specified in the URL', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/reports/123' })));
    useLocation.mockImplementation(useLocationMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportManager />
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(capturedRequestURLs.find((item) => item.includes(`${EVENT_API_URL}123`))).toBeDefined();
    });
  });

  test('does not fetch the event data if the id is "new"', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/reports/new' })));
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 123: eventWithPoint };
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportManager />
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(capturedRequestURLs.find((item) => item.includes(`${EVENT_API_URL}123`))).not.toBeDefined();
    });
  });

  test('does not fetch the event data if it is in the event store already', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/reports/123' })));
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 123: eventWithPoint };
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportManager />
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(capturedRequestURLs.find((item) => item.includes(`${EVENT_API_URL}123`))).not.toBeDefined();
    });
  });

  test('shows the added report when clicking the add report button', async () => {
    AddButtonMock = ({ onAddReport }) => { /* eslint-disable-line react/display-name */
      useEffect(() => {
        onAddReport({}, {}, 'd0884b8c-4ecb-45da-841d-f2f8d6246abf');
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null;
    };
    AddButton.mockImplementation(AddButtonMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportManager />
        </NavigationWrapper>
      </Provider>
    );

    const addedReportManager = (await screen.findAllByTestId('reportManagerContainer'))[1];

    await waitFor(() => {
      expect(addedReportManager).toHaveClass('show');
    });
  });
});
