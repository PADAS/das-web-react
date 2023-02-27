import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';

import { eventWithPoint, events } from '../../__test-helpers/fixtures/events';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';


import { EVENTS_API_URL, EVENT_API_URL } from '../../ducks/events';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import useNavigate from '../../hooks/useNavigate';

import ReportsFeedTab from '.';

import { rest } from 'msw';
import { setupServer } from 'msw/node';

const eventFeedResponse = { data: { results: events, next: null, count: events.length, page: 1 } };

const server = setupServer(
  rest.get(EVENTS_API_URL, (req, res, ctx) => {
    return res(ctx.json(eventFeedResponse));
  }),
  rest.get(`${EVENT_API_URL}:id`, (req, res, ctx) => {
    return res(ctx.json({ data: eventWithPoint }));
  }),
);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

jest.mock('../../hooks/useNavigate', () => jest.fn());

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ReportsFeedTab', () => {
  let navigate,
    store,
    useLocationMock,
    useNavigateMock,
    capturedRequestURLs;

  const logRequest = (req) => {
    capturedRequestURLs = [...capturedRequestURLs, req.url.toString()];
  };

  beforeEach(() => {
    capturedRequestURLs = [];
    useLocationMock = jest.fn((() => ({ pathname: '/reports' })));
    useLocation.mockImplementation(useLocationMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    jest.useFakeTimers();

    store = {
      data: {
        eventSchemas: {},
        eventStore: {},
        eventFilter: {
          state: ['new', 'active', 'resolved'],
          filter: {
            date_range: {
              lower: new Date(-864000000).toISOString(),
              upper: null,
            },
            event_type: [],
            priority: [],
            reported_by: [],
            text: '',
          },
        },
        eventTypes,
        feedEvents: { results: [] },
        patrolTypes,
      },
      view: {
        featureFlagOverrides: {},
      }
    };
  });

  server.events.on('request:match', (req) => {
    // console.log('a match', req.url.toString());
    logRequest(req);
  });

  afterEach(() => {
    jest.useRealTimers();
    server.events.removeListener('request:match', logRequest);
  });

  test('loads the feed', async () => {
  //   render(
  //     <Provider store={mockStore(store)}>
  //       <NavigationWrapper>
  //         <ReportsFeedTab />
  //       </NavigationWrapper>
  //     </Provider>
  //   );

  //   jest.runAllTimers();

  //   await screen.findAllByRole('listitem'); // wait for feed list items

  //   expect(
  //     capturedRequestURLs
  //       .find(item =>
  //         item.includes(EVENTS_API_URL)
  //       )
  //   ).toBeDefined();

  // });
});
