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
import { render, screen, waitFor } from '../../../test-utils';
import { report } from '../../../__test-helpers/fixtures/reports';

import ContainedReportListItem from '.';

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

  const renderCursorGpsDisplay = (props = {}, mockedStore) => render(
    <Provider store={mockedStore}>
      <ContainedReportListItem
        cardsExpanded={[report]}
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
    renderCursorGpsDisplay(undefined, mockedStore);

    await waitFor(() => {
      const actions = mockedStore.getActions();

      expect(actions).toContainEqual({ payload: [report], type: 'UPDATE_EVENT_STORE' });
    });
  });

  test('does not fetch the report if it is already in the store', async () => {
    store.data.eventStore[report.id] = report;
    const mockedStore = mockStore(store);
    renderCursorGpsDisplay(undefined, mockedStore);

    await waitFor(() => {
      const actions = mockedStore.getActions();

      expect(actions).not.toContainEqual({ payload: [report], type: 'UPDATE_EVENT_STORE' });
    });
  });

  test('fetches the schema if it is not in the store', async () => {
    store.data.eventStore[report.id] = report;
    const mockedStore = mockStore(store);
    renderCursorGpsDisplay(undefined, mockedStore);

    await waitFor(() => {
      const actions = mockedStore.getActions();

      expect(actions).toContainEqual({ type: 'FETCH_EVENT_TYPE_SCHEMA' });
    });
  });

  test('does not fetch the schema if it is already in the store', async () => {
    store.data.eventStore[report.id] = report;
    store.data.eventSchemas[report.event_type] = { [report.id]: {} };
    const mockedStore = mockStore(store);
    renderCursorGpsDisplay(undefined, mockedStore);

    await waitFor(() => {
      const actions = mockedStore.getActions();

      expect(actions).not.toContainEqual({ type: 'FETCH_EVENT_TYPE_SCHEMA' });
    });
  });

  test('does not fetch the schema if the event type is not available yet', async () => {
    store.data.eventStore[report.id] = report;
    store.data.eventTypes = [];
    const mockedStore = mockStore(store);
    renderCursorGpsDisplay(undefined, mockedStore);

    await waitFor(() => {
      const actions = mockedStore.getActions();

      expect(actions).not.toContainEqual({ type: 'FETCH_EVENT_TYPE_SCHEMA' });
    });
  });

  test('while report has not loaded yet, link to navigate into it does not show up', async () => {
    const mockedStore = mockStore(store);
    renderCursorGpsDisplay(undefined, mockedStore);

    expect((await screen.queryByTestId('arrow-into-icon'))).toBeNull();
  });

  test('once the report is loaded, link to navigate into it shows up', async () => {
    store.data.eventStore[report.id] = report;
    const mockedStore = mockStore(store);
    renderCursorGpsDisplay(undefined, mockedStore);

    expect((await screen.findByTestId('arrow-into-icon'))).toBeDefined();
  });

  test('user can open the report collapsible', async () => {
    const mockedStore = mockStore(store);
    renderCursorGpsDisplay({ cardsExpanded: [] }, mockedStore);

    expect(onExpand).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('activitySection-collapse-d45cb504-4612-41fe-9ea5-f1b423ac3ba4')))
      .toHaveClass('collapse');

    const expandNoteButton = await screen.findByTestId('activitySection-arrowDown-d45cb504-4612-41fe-9ea5-f1b423ac3ba4');
    await userEvent.click(expandNoteButton);

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  test('user can close the note collapsible', async () => {
    const mockedStore = mockStore(store);
    renderCursorGpsDisplay(undefined, mockedStore);

    expect(onCollapse).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('activitySection-collapse-d45cb504-4612-41fe-9ea5-f1b423ac3ba4')))
      .toHaveClass('show');

    const colapseNoteButton = await screen.findByTestId('activitySection-arrowUp-d45cb504-4612-41fe-9ea5-f1b423ac3ba4');
    await userEvent.click(colapseNoteButton);

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  test('while report has not loaded yet, the collapsible form does not show up', async () => {
    const mockedStore = mockStore(store);
    renderCursorGpsDisplay(undefined, mockedStore);

    expect((await screen.queryByText('Report Type'))).toBeNull();
  });

  test('once the report and schema loades, the collapsible form shows up', async () => {
    store.data.eventStore[report.id] = report;
    store.data.eventSchemas[report.event_type] = {
      [report.id]: eventSchemas.wildlife_sighting_rep['a78576a5-3c5b-40df-b374-12db53fbfdd6'],
    };
    const mockedStore = mockStore(store);
    renderCursorGpsDisplay(undefined, mockedStore);

    expect((await screen.findByText('Event Type'))).toBeDefined();
  });

  test('while the schema has not loaded yet, the schema form does not show up', async () => {
    store.data.eventStore[report.id] = report;
    const mockedStore = mockStore(store);
    renderCursorGpsDisplay(undefined, mockedStore);

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
    renderCursorGpsDisplay(undefined, mockedStore);

    expect((await screen.findByText('Species'))).toBeDefined();
  });
});
