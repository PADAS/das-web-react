import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import { fetchEventFeed, fetchNextEventFeedPage, showReportDetailView } from '../../ducks/events';
import { mockStore } from '../../__test-helpers/MockStore';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { report } from '../../__test-helpers/fixtures/reports';

import ReportsTab from './';

jest.mock('../../ducks/events', () => ({
  ...jest.requireActual('../../ducks/events'),
  fetchEventFeed: jest.fn(),
  fetchNextEventFeedPage: jest.fn(),
  showReportDetailView: jest.fn(),
}));

describe('ReportsTab', () => {
  let fetchEventFeedMock, fetchNextEventFeedPageMock, showReportDetailViewMock, store;

  beforeEach(() => {
    fetchEventFeedMock = jest.fn(() => Promise.resolve());
    fetchEventFeed.mockImplementation(fetchEventFeedMock);
    fetchNextEventFeedPageMock = jest.fn(() => Promise.resolve());
    fetchNextEventFeedPage.mockImplementation(fetchNextEventFeedPageMock);
    showReportDetailViewMock = jest.fn(() => () => {});
    showReportDetailView.mockImplementation(showReportDetailViewMock);

    store = {
      data: {
        eventTypes,
        feedEvents: { results: [] },
        patrolTypes,
      },
      view: {
        reportDetailView: { show: false },
      },
    };
  });

  test('shows the list of reports if the reportDetailView.show is false', () => {
    render(
      <Provider store={mockStore(store)}>
        <ReportsTab />
      </Provider>
    );

    expect(screen.queryByTestId('reportDetailViewContainer')).toBeNull();
  });

  test('shows the detail report view if reportDetailView.show is true', async () => {
    store.view.reportDetailView = { report, show: true };
    render(
      <Provider store={mockStore(store)}>
        <ReportsTab />
      </Provider>
    );

    expect(screen.queryByTestId('reportDetailViewContainer')).toBeDefined();
  });
});
