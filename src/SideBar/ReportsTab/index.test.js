import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { useLocation } from 'react-router-dom';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import { fetchEvent, fetchEventFeed, fetchNextEventFeedPage } from '../../ducks/events';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import useNavigate from '../../hooks/useNavigate';

import ReportsTab from './';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

jest.mock('../../ducks/events', () => ({
  ...jest.requireActual('../../ducks/events'),
  fetchEvent: jest.fn(),
  fetchEventFeed: jest.fn(),
  fetchNextEventFeedPage: jest.fn(),
}));

jest.mock('../../hooks/useNavigate', () => jest.fn());

describe('ReportsTab', () => {
  let fetchEventMock,
    fetchEventFeedMock,
    fetchNextEventFeedPageMock,
    navigate,
    store,
    useLocationMock,
    useNavigateMock;

  beforeEach(() => {
    fetchEventMock = jest.fn(() => Promise.resolve());
    fetchEvent.mockImplementation(fetchEventMock);
    fetchEventFeedMock = jest.fn(() => Promise.resolve());
    fetchEventFeed.mockImplementation(fetchEventFeedMock);
    fetchNextEventFeedPageMock = jest.fn(() => Promise.resolve());
    fetchNextEventFeedPage.mockImplementation(fetchNextEventFeedPageMock);
    useLocationMock = jest.fn((() => ({ pathname: '/reports' })));
    useLocation.mockImplementation(useLocationMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    store = {
      data: {
        eventStore: {},
        eventTypes,
        feedEvents: { results: [] },
        patrolTypes,
      },
    };
  });

  test('fetches the event data if there is an id specified in the URL', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/reports/123' })));
    useLocation.mockImplementation(useLocationMock);

    expect(fetchEvent).toHaveBeenCalledTimes(0);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTab />
        </NavigationWrapper>
      </Provider>
    );

    expect(fetchEvent).toHaveBeenCalledTimes(1);
    expect(fetchEvent).toHaveBeenCalledWith('123');
  });

  test('does not fetch the event data if the id is "new"', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/reports/new' })));
    useLocation.mockImplementation(useLocationMock);
    store.data.eventStore = { 123: {} };
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTab />
        </NavigationWrapper>
      </Provider>
    );

    expect(fetchEvent).toHaveBeenCalledTimes(0);
  });

  test('does not fetch the event data if it is in the event store already', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/reports/123' })));
    useLocation.mockImplementation(useLocationMock);
    store.data.eventStore = { 123: {} };
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTab />
        </NavigationWrapper>
      </Provider>
    );

    expect(fetchEvent).toHaveBeenCalledTimes(0);
  });

  test('loads the feed', () => {
    expect(fetchEventFeed).toHaveBeenCalledTimes(0);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTab />
        </NavigationWrapper>
      </Provider>
    );

    expect(fetchEventFeed).toHaveBeenCalledTimes(1);
  });
});
