import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import Header from './';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { report } from '../../__test-helpers/fixtures/reports';

describe('ReportManager - Header', () => {
  const onChangeTitle = jest.fn();
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders correctly case of a 300 priority report', async () => {
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} onChangeTitle={onChangeTitle} />
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findByTestId('reportDetailHeader-icon'))).toHaveClass('priority-300');
  });

  test('sets the display title as the title if it was empty', async () => {
    expect(onChangeTitle).toHaveBeenCalledTimes(0);

    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} onChangeTitle={onChangeTitle} />
        </NavigationWrapper>
      </Provider>
    );

    expect(onChangeTitle).toHaveBeenCalledTimes(1);
    expect(onChangeTitle).toHaveBeenCalledWith('Light');
  });

  test('triggers setTitle callback when the contenteditable loses focus', async () => {
    report.title = 'Light';
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} onChangeTitle={onChangeTitle} />
        </NavigationWrapper>
      </Provider>
    );

    const titleTextBox = await screen.findByTestId('reportManager-header-title');
    userEvent.type(titleTextBox, '{del}{del}{del}{del}{del}2');
    userEvent.tab();

    await waitFor(() => {
      expect(onChangeTitle).toHaveBeenCalledTimes(1);
      expect(onChangeTitle).toHaveBeenCalledWith('2');
    });
  });

  test('sets the event type title if user leaves the title input empty', async () => {
    report.title = 'Light';
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} onChangeTitle={onChangeTitle} />
        </NavigationWrapper>
      </Provider>
    );

    const titleTextBox = await screen.findByTestId('reportManager-header-title');
    userEvent.type(titleTextBox, '{del}{del}{del}{del}{del}');
    userEvent.tab();

    expect(onChangeTitle).toHaveBeenCalledTimes(1);
    expect(onChangeTitle).toHaveBeenCalledWith('Light');
  });

  test('shows the event type label if the title does not match the event type title', async () => {
    report.title = 'Report!';
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} onChangeTitle={onChangeTitle} />
        </NavigationWrapper>
      </Provider>
    );

    const eventTypeLabel = await screen.findByTestId('reportManager-header-eventType');

    expect(eventTypeLabel).toHaveTextContent('Light');
  });

  test('doest not show the event type label if the title matches the event type title', async () => {
    report.title = 'Light';
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} onChangeTitle={onChangeTitle} />
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByTestId('reportManager-header-eventType'))).toBeNull();
  });

  test('renders the priority and date values if report is not new', async () => {
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} onChangeTitle={onChangeTitle} />
        </NavigationWrapper>
      </Provider>
    );

    expect(await screen.findByTestId('reportManager-header-priorityAndDate')).toBeDefined();
  });

  test('does not render the priority and date values if report is new', async () => {
    report.id = undefined;
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} onChangeTitle={onChangeTitle} />
        </NavigationWrapper>
      </Provider>
    );

    expect(await screen.queryByTestId('reportManager-header-priorityAndDate')).toBeNull();
  });

  test('renders the location jump button if the report has coordinates', async () => {
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} onChangeTitle={onChangeTitle} />
        </NavigationWrapper>
      </Provider>
    );

    expect(await screen.findByTitle('Jump to this location')).toBeDefined();
  });

  test('does not render the location jump button if the report does not have coordinates', async () => {
    report.geojson.geometry.coordinates = null;
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} onChangeTitle={onChangeTitle} />
        </NavigationWrapper>
      </Provider>
    );

    expect(await screen.queryByTitle('Jump to this location')).toBeNull();
  });

  test('rendering a small "p" indicator if the report is associated with patrols', async () => {
    const { rerender } = render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} onChangeTitle={onChangeTitle} />
        </NavigationWrapper>
      </Provider>
    );

    let reportIcon = await screen.queryByRole('img');
    expect(reportIcon).not.toHaveTextContent('p');

    report.patrols = ['dfasd-x-adfasxf-1'];

    rerender(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} onChangeTitle={onChangeTitle} />
        </NavigationWrapper>
      </Provider>
    );

    reportIcon = await screen.queryByRole('img');
    expect(reportIcon).toHaveTextContent('p');
  });
});
