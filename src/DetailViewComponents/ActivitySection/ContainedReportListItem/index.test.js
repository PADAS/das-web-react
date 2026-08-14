import React from 'react';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import { EVENT_API_URL } from '../../../ducks/events';
import { EVENT_TYPE_SCHEMA_V1_URL } from '../../../ducks/event-schemas';
import { eventSchemas } from '../../../__test-helpers/fixtures/event-schemas';
import { eventTypes } from '../../../__test-helpers/fixtures/event-types';
import { mockStore } from '../../../__test-helpers/MockStore';
import { NavigationContext } from '../../../NavigationContextProvider';
import { PRIORITY_COLOR_MAP } from '../../../utils/events';
import { render, screen, waitFor } from '../../../test-utils';
import { report } from '../../../__test-helpers/fixtures/reports';

import ContainedReportListItem from '.';

import * as activitySectionStyles from '../styles.module.scss';

const server = setupServer(
  http.get(`${EVENT_API_URL}:eventId`, () => HttpResponse.json( { data: { ...report } })),
  http.get(EVENT_TYPE_SCHEMA_V1_URL(':name'), () => HttpResponse.json( { data: { results: {} } }))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ActivitySection - ContainedReportListItem', () => {
  const onCollapse = jest.fn(), onExpand = jest.fn();
  let store;

  const renderContainedReportListItem = (props = {}, mockedStore) => render(
    <Provider store={mockedStore}>
      <ContainedReportListItem
        isOpen={true}
        report={report}
        onCollapse={onCollapse}
        onExpand={onExpand}
        {...props}
      />
    </Provider>
  );

  beforeEach(() => {
    store = { data: { eventSchemas: {}, eventStore: {}, eventTypes, patrolTypes: [] }, view: {} };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('fetches the report if it is not in the store', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    await waitFor(() => {
      const actions = mockedStore.getActions();

      expect(actions).toContainEqual({ payload: [report], type: 'UPDATE_EVENT_STORE' });
    });
  });

  test('does not fetch the report if it is already in the store', async () => {
    store.data.eventStore[report.id] = report;
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    await waitFor(() => {
      const actions = mockedStore.getActions();

      expect(actions).not.toContainEqual({ payload: [report], type: 'UPDATE_EVENT_STORE' });
    });
  });

  test('keeps showing the loader if the report fetch fails', async () => {
    const onUnhandledRejection = jest.fn();
    process.on('unhandledRejection', onUnhandledRejection);
    server.use(http.get(`${EVENT_API_URL}:eventId`, () => HttpResponse.error()));

    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    await waitFor(() => expect(mockedStore.getActions()).toHaveLength(0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    process.off('unhandledRejection', onUnhandledRejection);

    expect(onUnhandledRejection).toHaveBeenCalledTimes(0);
    expect((await screen.findByRole('status', { name: 'Loading Light' }))).toBeDefined();
  });

  test('fetches the schema if it is not in the store', async () => {
    store.data.eventStore[report.id] = report;
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    await waitFor(() => {
      const actions = mockedStore.getActions();

      expect(actions).toContainEqual({ type: 'FETCH_EVENT_TYPE_SCHEMA' });
    });
  });

  test('does not fetch the schema if it is already in the store', async () => {
    store.data.eventStore[report.id] = report;
    store.data.eventSchemas[report.event_type] = { [report.id]: {} };
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    await waitFor(() => {
      const actions = mockedStore.getActions();

      expect(actions).not.toContainEqual({ type: 'FETCH_EVENT_TYPE_SCHEMA' });
    });
  });

  test('does not fetch the schema if the event type is not available yet', async () => {
    store.data.eventStore[report.id] = report;
    store.data.eventTypes = [];
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    await waitFor(() => {
      const actions = mockedStore.getActions();

      expect(actions).not.toContainEqual({ type: 'FETCH_EVENT_TYPE_SCHEMA' });
    });
  });

  test('while report has not loaded yet, link to navigate into it does not show up', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    expect((await screen.queryByTestId('arrow-into-icon'))).toBeNull();
  });

  test('once the report is loaded, link to navigate into it shows up', async () => {
    store.data.eventStore[report.id] = report;
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    expect((await screen.findByTestId('arrow-into-icon'))).toBeDefined();
  });

  test('the link to navigate into the report points at its detail view', async () => {
    store.data.eventStore[report.id] = report;
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    const link = await screen.findByRole('link', { name: 'View event Light' });

    expect(link).toHaveAttribute('href', `/events/${report.id}`);
    expect(link).toHaveAttribute('title', 'View event Light');
  });

  test('user can open the report collapsible', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem({ isOpen: false }, mockedStore);

    expect(onExpand).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('activitySection-collapse-d45cb504-4612-41fe-9ea5-f1b423ac3ba4')))
      .toHaveClass('collapse');

    const expandReportButton = await screen.findByRole('button', { name: 'Expand Light' });

    expect(expandReportButton).toHaveAttribute('aria-expanded', 'false');
    expect(expandReportButton).toHaveAttribute('title', 'Expand Light');

    await userEvent.click(expandReportButton);

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  test('user can close the report collapsible', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    expect(onCollapse).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('activitySection-collapse-d45cb504-4612-41fe-9ea5-f1b423ac3ba4')))
      .toHaveClass('show');

    const collapseReportButton = await screen.findByRole('button', { name: 'Collapse Light' });

    expect(collapseReportButton).toHaveAttribute('aria-expanded', 'true');
    expect(collapseReportButton).toHaveAttribute('title', 'Collapse Light');

    await userEvent.click(collapseReportButton);

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  test('the report collapsible starts closed', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem({ isOpen: undefined }, mockedStore);

    expect((await screen.findByTestId('activitySection-collapse-d45cb504-4612-41fe-9ea5-f1b423ac3ba4')))
      .not.toHaveClass('show');
  });

  test('clicking anywhere on the row toggles the collapsible', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem({ isOpen: false }, mockedStore);

    const row = (await screen.findByTestId('activitySection-arrowDown-d45cb504-4612-41fe-9ea5-f1b423ac3ba4')).closest('div');
    await userEvent.click(row);

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  test('clicking the go to report button does not also toggle the collapsible', async () => {
    store.data.eventStore[report.id] = report;
    const mockedStore = mockStore(store);
    renderContainedReportListItem({ isOpen: false }, mockedStore);

    const goToReportButton = await screen.findByTestId('arrow-into-icon');
    await userEvent.click(goToReportButton);

    expect(onExpand).toHaveBeenCalledTimes(0);
  });

  test('clicking the go to report button does not toggle the collapsible while navigation is blocked', async () => {
    store.data.eventStore[report.id] = report;
    const mockedStore = mockStore(store);
    const navigationContextValue = {
      blocker: { state: 'unblocked' },
      isNavigationBlocked: true,
      onNavigationAttemptBlocked: jest.fn(),
    };

    render(
      <Provider store={mockedStore}>
        <NavigationContext.Provider value={navigationContextValue}>
          <ContainedReportListItem isOpen={false} onCollapse={onCollapse} onExpand={onExpand} report={report} />
        </NavigationContext.Provider>
      </Provider>
    );

    const goToReportButton = await screen.findByTestId('arrow-into-icon');
    await userEvent.click(goToReportButton);

    expect(navigationContextValue.onNavigationAttemptBlocked).toHaveBeenCalledTimes(1);
    expect(onExpand).toHaveBeenCalledTimes(0);
  });

  test('the row is not keyboard focusable, only the collapse toggle button is', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem({ isOpen: false }, mockedStore);

    const row = (await screen.findByTestId('activitySection-arrowDown-d45cb504-4612-41fe-9ea5-f1b423ac3ba4')).closest('div');
    const collapseToggleButton = await screen.findByRole('button', { name: 'Expand Light' });

    expect(row).not.toHaveAttribute('tabindex');
    expect(row).not.toHaveAttribute('role');
    expect(collapseToggleButton.tagName).toBe('BUTTON');
  });

  test('shows the date time the report was reported at', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    expect((await screen.findByTestId(`activitySection-dateTime-${report.id}`)))
      .toHaveAttribute('dateTime', new Date(report.time).toISOString());
  });

  test('falls back to the last update time if the report has no report time', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem({ report: { ...report, time: undefined } }, mockedStore);

    expect((await screen.findByTestId(`activitySection-dateTime-${report.id}`)))
      .toHaveAttribute('dateTime', new Date(report.updated_at).toISOString());
  });

  test('does not show a date time if the report has neither a report time nor an update', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem({ report: { ...report, time: undefined, updated_at: undefined } }, mockedStore);

    expect((screen.queryByTestId(`activitySection-dateTime-${report.id}`))).toBeNull();
  });

  test('colors the row after the priority of the report', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    const row = (await screen.findByTestId('activitySection-arrowUp-d45cb504-4612-41fe-9ea5-f1b423ac3ba4'))
      .closest(`.${activitySectionStyles.itemRow}`);

    expect(row).toHaveClass(PRIORITY_COLOR_MAP['300'].key);
  });

  test('falls back to the no priority colors if the report priority is unknown', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem({ report: { ...report, priority: 999 } }, mockedStore);

    const row = (await screen.findByTestId('activitySection-arrowUp-d45cb504-4612-41fe-9ea5-f1b423ac3ba4'))
      .closest(`.${activitySectionStyles.itemRow}`);

    expect(row).toHaveClass(PRIORITY_COLOR_MAP['0'].key);
  });

  test('while report has not loaded yet, the collapsible form does not show up', async () => {
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    expect((await screen.queryByText('Report Type'))).toBeNull();
  });

  test('once the report and schema load, the collapsible form shows up', async () => {
    store.data.eventStore[report.id] = report;
    store.data.eventSchemas[report.event_type] = {
      [report.id]: eventSchemas.wildlife_sighting_rep['a78576a5-3c5b-40df-b374-12db53fbfdd6'],
    };
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    expect((await screen.findByText('Event Type'))).toBeDefined();
  });

  test('while the schema has not loaded yet, the schema form does not show up', async () => {
    store.data.eventStore[report.id] = report;
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    expect((await screen.queryByText('Species'))).toBeNull();
  });

  test('once the schema loads, the schema form shows up', async () => {
    store.data.eventStore[report.id] = {
      ...report,
      event_details: {
        wildlifesightingrep_species: 'cheetah'
      }
    };
    store.data.eventSchemas[report.event_type] = {
      [report.id]: eventSchemas.wildlife_sighting_rep['a78576a5-3c5b-40df-b374-12db53fbfdd6'],
    };
    const mockedStore = mockStore(store);
    renderContainedReportListItem(undefined, mockedStore);

    expect((await screen.findByText('Species'))).toBeDefined();
  });
});
