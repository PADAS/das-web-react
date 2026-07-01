import React from 'react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { GPS_FORMATS } from '../utils/location';

import eventCategories from '../__test-helpers/fixtures/event-categories';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';
import { render, screen, waitFor } from '../test-utils';

import TimepointPopup from './';

// Track point time is serialized in UTC; the observation's recorded_at is the SAME
// INSTANT but serialized with the tenant's local offset. A naive string comparison
// would never match (BUG 1 regression guard).
const TIMEPOINT_TIME = '2021-01-27T09:04:25+00:00';
const OBSERVATION_TIME = '2021-01-27T02:04:25-07:00';
const SUBJECT_ID = '172df632-3fd4-4e5d-8366-925b92fcf025';

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
    systemConfig: {},
    userPreferences: {
      gpsFormat: GPS_FORMATS.DEG,
    },
  },
};

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
    expect(screen.queryByTestId('additional-props')).not.toBeInTheDocument();
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

  test('does not render the toggle or props when no observation is returned', async () => {
    observationsHandler = () => observationResponse([]);

    renderPopup();

    expect(await screen.findByText('RD-001')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('additional-props-toggle-btn')).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId('additional-props')).not.toBeInTheDocument();
  });

  test('renders nothing extra on fetch error', async () => {
    observationsHandler = () => new HttpResponse(null, { status: 500 });

    renderPopup();

    expect(await screen.findByText('RD-001')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('additional-props-toggle-btn')).not.toBeInTheDocument();
    });
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
