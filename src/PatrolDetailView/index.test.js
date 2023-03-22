import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';
import { useLocation, useSearchParams } from 'react-router-dom';

import { executeSaveActions } from '../utils/save';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import { patrolDefaultStoreData, scheduledPatrol } from '../__test-helpers/fixtures/patrols';
import PatrolDetailView from './';
import { PATROLS_API_URL } from '../ducks/patrols';
import { TAB_KEYS } from '../constants';
import useNavigate from '../hooks/useNavigate';
import { GPS_FORMATS } from '../utils/location';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock('../hooks/useNavigate', () => jest.fn());
jest.mock('../utils/save', () => ({
  ...jest.requireActual('../utils/save'),
  executeSaveActions: jest.fn(),
}));

const server = setupServer(
  rest.get(
    `${PATROLS_API_URL}:id`,
    (req, res, ctx) => res(ctx.json({ data: scheduledPatrol }))
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let store = patrolDefaultStoreData;
store.data.subjectStore = {};
store.data.user = { permissions: { patrol: ['change'] } };
store.view.userPreferences = { gpsFormat: Object.values(GPS_FORMATS)[0] };
store.view.mapLocationSelection = {};

describe('PatrolDetailView', () => {
  let capturedRequestURLs;
  const logRequest = (req) => {
    capturedRequestURLs = [...capturedRequestURLs, req.url.toString()];
  };

  let executeSaveActionsMock, navigate, useLocationMock, useSearchParamsMock, useNavigateMock;

  beforeEach(() => {
    capturedRequestURLs = [];
    navigate = jest.fn();
    executeSaveActionsMock = jest.fn(() => Promise.resolve());
    executeSaveActions.mockImplementation(executeSaveActionsMock);
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/new', state: { temporalId: '1234' } }));
    useLocation.mockImplementation(useLocationMock);
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);
    useSearchParamsMock = jest.fn(() => ([new URLSearchParams({ patrolType: 'dog_patrol' })]));
    useSearchParams.mockImplementation(useSearchParamsMock);
  });

  server.events.on('request:match', (req) => logRequest(req));

  afterEach(() => {
    jest.restoreAllMocks();
    server.events.removeListener('request:match', logRequest);
  });

  test('redirects to /patrols if user tries to create a new patrol with an invalid patrolType', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/new', state: {} }),);
    useLocation.mockImplementation(useLocationMock);
    useSearchParamsMock = jest.fn(() => ([new URLSearchParams({ patrolType: 'invalid' })]));
    useSearchParams.mockImplementation(useSearchParamsMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <PatrolDetailView />
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/patrols', { replace: true });
    });
  });

  test('redirects to the same route assignin a temporal id in case it is missing', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/patrols/new', search: '?patrolType=1234', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <PatrolDetailView />
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalled();
      expect(navigate.mock.calls[0][0]).toBe('/patrols/new?patrolType=1234');
      expect(navigate.mock.calls[0][1]).toHaveProperty('replace');
      expect(navigate.mock.calls[0][1]).toHaveProperty('state');
      expect(navigate.mock.calls[0][1].state).toHaveProperty('temporalId');
    });
  });

  test('fetches the patrol data if there is an id specified in the URL', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols/123' })));
    useLocation.mockImplementation(useLocationMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <PatrolDetailView />
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(capturedRequestURLs.find((item) => item.includes(`${PATROLS_API_URL}123`))).toBeDefined();
    });
  });

  test('does not fetch the patrol data if the id is "new"', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols/new' })));
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 123: scheduledPatrol };
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <PatrolDetailView />
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(capturedRequestURLs.find((item) => item.includes(`${PATROLS_API_URL}123`))).not.toBeDefined();
    });
  });

  test('does not fetch the patrol data if it is in the patrol store already', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols/123' })));
    useLocation.mockImplementation(useLocationMock);

    store.data.eventStore = { 123: scheduledPatrol };
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <PatrolDetailView />
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(capturedRequestURLs.find((item) => item.includes(`${PATROLS_API_URL}123`))).not.toBeDefined();
    });
  });

  test('updates the title when user types in it', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <PatrolDetailView />
        </NavigationWrapper>
      </Provider>
    );

    const titleInput = await screen.findByTestId('patrolDetailView-header-title');

    expect(titleInput).toHaveTextContent('Unknown patrol type');

    userEvent.type(titleInput, '2');

    expect(titleInput).toHaveTextContent('2nknown patrol type');
  });

  test('executes save actions when clicking save and navigates to patrol feed', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <PatrolDetailView />
        </NavigationWrapper>
      </Provider>
    );

    const titleInput = (await screen.findAllByRole('textbox'))[0];
    userEvent.type(titleInput, '2');
    userEvent.tab();

    expect(executeSaveActions).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    await waitFor(() => {
      expect(executeSaveActions).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(`/${TAB_KEYS.PATROLS}`);
    });
  });
});
