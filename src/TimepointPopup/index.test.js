import React from 'react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fetchObservationsForSubject } from '../ducks/observations';
import { GPS_FORMATS } from '../utils/location';
import { SYSTEM_CONFIG_FLAGS } from '../constants';

import eventCategories from '../__test-helpers/fixtures/event-categories';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';
import { render, screen, waitFor } from '../test-utils';

import TimepointPopup from './';

jest.mock('../ducks/observations', () => {
  const actual = jest.requireActual('../ducks/observations');

  return { ...actual, fetchObservationsForSubject: jest.fn(actual.fetchObservationsForSubject) };
});

jest.mock('../AddItemButton', () => ({
  __esModule: true,
  default: ({ reportData }) => <div data-testid="add-item-button" data-report={JSON.stringify(reportData)} />,
}));

// Same instant, serialized in UTC and with a tenant offset.
const TIMEPOINT_TIME = '2021-01-27T09:04:25+00:00';
const OBSERVATION_TIME = '2021-01-27T02:04:25-07:00';
const SUBJECT_ID = '172df632-3fd4-4e5d-8366-925b92fcf025';
const TOLERATED_MATCH_DISTANCE_MS = 1000;

const timepointData = {
  type: 'Feature',
  properties: {
    id: SUBJECT_ID,
    name: 'RD-001',
    title: 'RD-001',
    time: TIMEPOINT_TIME,
  },
  geometry: {
    type: 'Point',
    coordinates: [37.37617, 0.22316],
  },
};

const matchingObservation = {
  id: 'observation-id',
  recorded_at: OBSERVATION_TIME,
  location: { latitude: 0.22316, longitude: 37.37617 },
  device_status_properties: [
    { label: 'Favorite Color', units: '', value: 'DarkBlue' },
    { label: 'Model No.', units: '', value: 'Gidr1000' },
    { label: 'Battery', units: '%', value: '80' },
  ],
};

const observationResponse = (results) => HttpResponse.json({ data: { count: results.length, results } });

let observationsHandler;
let capturedRequestUrl;
const server = setupServer(
  http.get('*/observations', (info) => {
    capturedRequestUrl = new URL(info.request.url);
    return observationsHandler(info);
  }),
);

const state = {
  data: {
    eventCategories,
    eventTypes,
    patrolTypes: [],
  },
  view: {
    coordinateReferenceSystems: {
      selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
      storedSystems: [],
    },
    systemConfig: { [SYSTEM_CONFIG_FLAGS.EVENTS]: true },
    userPreferences: {
      gpsFormat: GPS_FORMATS.DEG,
    },
  },
};

const { fetchObservationsForSubject: unmockedFetchObservationsForSubject } =
  jest.requireActual('../ducks/observations');

const Wrapper = ({ children }) => <Provider store={mockStore(state)}>{children}</Provider>;

const renderPopup = (props = {}) => render(
  <TimepointPopup data={timepointData} {...props} />,
  { wrapper: Wrapper },
);

beforeAll(() => server.listen());

beforeEach(() => {
  window.localStorage.clear();
  capturedRequestUrl = undefined;
  observationsHandler = () => observationResponse([matchingObservation]);
  fetchObservationsForSubject.mockImplementation(unmockedFetchObservationsForSubject);
});

afterEach(() => {
  server.resetHandlers();
  window.localStorage.clear();
});

afterAll(() => server.close());

describe('TimepointPopup', () => {
  test('renders the timepoint title', () => {
    renderPopup();

    expect(screen.getByText('RD-001')).toBeInTheDocument();
  });

  test('matches the observation by instant despite a different UTC offset, revealing device props on toggle', async () => {
    renderPopup();

    const toggleButton = await screen.findByTestId('additional-props-toggle-btn');

    await userEvent.click(toggleButton);

    const additionalProps = await screen.findByTestId('additional-props');
    matchingObservation.device_status_properties.forEach(({ label, value }) => {
      expect(additionalProps).toHaveTextContent(label);
      expect(additionalProps).toHaveTextContent(value.toString());
    });

    await userEvent.click(toggleButton);
    expect(screen.getByTestId('additional-props')).not.toBeVisible();
  });

  test('queries a non-zero time window bracketing the point (since != until)', async () => {
    renderPopup();

    await screen.findByTestId('additional-props-toggle-btn');

    const since = capturedRequestUrl.searchParams.get('since');
    const until = capturedRequestUrl.searchParams.get('until');

    expect(since).toBeTruthy();
    expect(until).toBeTruthy();
    expect(since).not.toBe(until);

    const targetInstant = new Date(TIMEPOINT_TIME).getTime();
    expect(new Date(since).getTime()).toBeLessThan(targetInstant);
    expect(new Date(until).getTime()).toBeGreaterThan(targetInstant);
  });

  test('does not opt status-only pings into the match, and pages large enough for chatty devices', async () => {
    renderPopup();

    await screen.findByTestId('additional-props-toggle-btn');

    expect(capturedRequestUrl.searchParams.get('include_empty_location')).toBeNull();
    expect(Number(capturedRequestUrl.searchParams.get('page_size'))).toBeGreaterThanOrEqual(100);
  });

  test('brackets the point with a window wider than the tolerance a match must fall inside', async () => {
    renderPopup();

    await screen.findByTestId('additional-props-toggle-btn');

    const targetInstant = new Date(TIMEPOINT_TIME).getTime();
    const since = new Date(capturedRequestUrl.searchParams.get('since')).getTime();
    const until = new Date(capturedRequestUrl.searchParams.get('until')).getTime();

    expect(targetInstant - since).toBeGreaterThan(TOLERATED_MATCH_DISTANCE_MS);
    expect(until - targetInstant).toBeGreaterThan(TOLERATED_MATCH_DISTANCE_MS);
  });

  test('carries the point subject and time into a report started from the popup', async () => {
    renderPopup();

    const reportData = JSON.parse(screen.getByTestId('add-item-button').dataset.report);

    expect(reportData).toEqual({
      location: { latitude: 0.22316, longitude: 37.37617 },
      reportedById: SUBJECT_ID,
      time: TIMEPOINT_TIME,
    });
  });

  test('ignores an observation whose recorded_at cannot be parsed', async () => {
    observationsHandler = () => observationResponse([
      { ...matchingObservation, id: 'unparseable', recorded_at: 'not-a-date' },
      matchingObservation,
    ]);

    renderPopup();

    const additionalProps = await screen.findByTestId('additional-props');
    expect(additionalProps).toHaveTextContent('Gidr1000');
  });

  test('attributes nothing when two observations sit equally close to the point', async () => {
    const targetInstant = new Date(TIMEPOINT_TIME).getTime();
    observationsHandler = () => observationResponse([
      { ...matchingObservation, id: 'before', recorded_at: new Date(targetInstant - 400).toISOString() },
      { ...matchingObservation, id: 'after', recorded_at: new Date(targetInstant + 400).toISOString() },
    ]);

    renderPopup();

    await waitFor(() => expect(capturedRequestUrl).toBeDefined());

    await expect(screen.findByTestId('additional-props-toggle-btn')).rejects.toThrow();
  });

  test('does not report a cancelled request as a failure', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    fetchObservationsForSubject.mockImplementation(
      () => () => Promise.reject(new axios.CanceledError('canceled'))
    );

    renderPopup();

    expect(await screen.findByText('RD-001')).toBeInTheDocument();

    await waitFor(() => expect(fetchObservationsForSubject).toHaveBeenCalled());
    expect(warn).not.toHaveBeenCalled();
    expect(screen.queryByTestId('additional-props-toggle-btn')).not.toBeInTheDocument();

    warn.mockRestore();
  });

  test('does not attribute an observation outside the match tolerance to the point', async () => {
    observationsHandler = () => observationResponse([{
      ...matchingObservation,
      recorded_at: new Date(new Date(TIMEPOINT_TIME).getTime() + 5000).toISOString(),
    }]);

    renderPopup();

    await waitFor(() => expect(capturedRequestUrl).toBeDefined());

    await expect(screen.findByTestId('additional-props-toggle-btn')).rejects.toThrow();
    expect(screen.queryByText(/Gidr1000/)).not.toBeInTheDocument();
  });

  test('does not render the toggle or props when no observation is returned', async () => {
    observationsHandler = () => observationResponse([]);

    renderPopup();

    expect(await screen.findByText('RD-001')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('additional-props-toggle-btn')).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId('additional-props')).not.toBeInTheDocument();
  });

  test('reports the failure and renders nothing extra on fetch error', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    observationsHandler = () => new HttpResponse(null, { status: 500 });

    renderPopup();

    expect(await screen.findByText('RD-001')).toBeInTheDocument();

    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(screen.queryByTestId('additional-props-toggle-btn')).not.toBeInTheDocument();

    warn.mockRestore();
  });

  test('shows props by default when localStorage preference is set', async () => {
    window.localStorage.setItem('showSubjectDetailsByDefault', 'true');

    renderPopup();

    const additionalProps = await screen.findByTestId('additional-props');
    expect(additionalProps).toHaveTextContent('Favorite Color');
  });

  test('persists the toggle preference to localStorage', async () => {
    renderPopup();

    const toggleButton = await screen.findByTestId('additional-props-toggle-btn');

    await userEvent.click(toggleButton);
    expect(window.localStorage.getItem('showSubjectDetailsByDefault')).toBe('true');

    await userEvent.click(toggleButton);
    expect(window.localStorage.getItem('showSubjectDetailsByDefault')).toBe('false');
  });
});
