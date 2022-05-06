import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import { fetchEventFeed, fetchNextEventFeedPage } from '../../ducks/events';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { report } from '../../__test-helpers/fixtures/reports';
import { showDetailView } from '../../ducks/side-bar';
import { TAB_KEYS } from '../../constants';
import useNavigate from '../../hooks/useNavigate';

import ReportsTab from './';

jest.mock('../../constants', () => ({
  ...jest.requireActual('../../constants'),
  DEVELOPMENT_FEATURE_FLAGS: { ENABLE_URL_NAVIGATION: true },
}));

jest.mock('../../ducks/events', () => ({
  ...jest.requireActual('../../ducks/events'),
  fetchEventFeed: jest.fn(),
  fetchNextEventFeedPage: jest.fn(),
}));

jest.mock('../../ducks/side-bar', () => ({
  ...jest.requireActual('../../ducks/side-bar'),
  showDetailView: jest.fn(),
}));
jest.mock('../../hooks/useNavigate', () => jest.fn());

describe('ReportsTab', () => {
  let fetchEventFeedMock, fetchNextEventFeedPageMock, navigate, showDetailViewMock, store, useNavigateMock;

  beforeEach(() => {
    fetchEventFeedMock = jest.fn(() => Promise.resolve());
    fetchEventFeed.mockImplementation(fetchEventFeedMock);
    fetchNextEventFeedPageMock = jest.fn(() => Promise.resolve());
    fetchNextEventFeedPage.mockImplementation(fetchNextEventFeedPageMock);
    showDetailViewMock = jest.fn(() => () => {});
    showDetailView.mockImplementation(showDetailViewMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    store = {
      data: {
        eventTypes,
        feedEvents: { results: [] },
        patrolTypes,
      },
      view: {
        sideBar: { currentTab: TAB_KEYS.REPORTS, showDetailView: false },
      },
    };
  });

  test('shows the list of reports if the reportDetailView.show is false', () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTab />
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.queryByTestId('reportDetailViewContainer')).toBeNull();
  });

  test('shows the detail report view if reportDetailView.show is true', async () => {
    store.view.reportDetailView = { report, show: true };
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTab />
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.queryByTestId('reportDetailViewContainer')).toBeDefined();
  });
});
