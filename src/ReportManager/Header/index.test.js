import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { TrackerContext } from '../../utils/analytics';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import Header from './';

import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { render, screen, waitFor } from '../../test-utils';
import { report } from '../../__test-helpers/fixtures/reports';

describe('ReportManager - Header', () => {
  let store = mockStore({
    data: {
      eventTypes,
      patrolTypes,
    },
    view: {
      featureFlagOverrides: {},
    },
  });

  const onChangeTitle = jest.fn();
  let Wrapper, renderWithWrapper;

  beforeEach(() => {

    Wrapper = ({ children }) => /* eslint-disable-line react/display-name */
      <Provider store={store}>
        <NavigationWrapper>
          <TrackerContext.Provider value={{ track: jest.fn() }}>
            {children}
          </TrackerContext.Provider>
        </NavigationWrapper>
      </Provider>;

    renderWithWrapper = (Component) => render(Component, { wrapper: Wrapper });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders correctly case of a 300 priority report', async () => {
    renderWithWrapper(
      <Header report={report} onChangeTitle={onChangeTitle} />
    );

    expect((await screen.findByTestId('reportDetailHeader-icon'))).toHaveClass('priority-300');
  });

  test('sets the display title as the title if it was empty without changing the form', async () => {
    renderWithWrapper(
      <Header report={report} onChangeTitle={onChangeTitle} />
    );

    expect((await screen.findByTestId('reportManager-header-title'))).toHaveTextContent('Light');
    expect(onChangeTitle).toHaveBeenCalledTimes(0);
  });

  test('triggers setTitle callback when the contenteditable loses focus', async () => {
    report.title = 'Light';
    renderWithWrapper(
      <Header report={report} onChangeTitle={onChangeTitle} />
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
    renderWithWrapper(
      <Header report={report} onChangeTitle={onChangeTitle} />
    );

    const titleTextBox = await screen.findByTestId('reportManager-header-title');
    userEvent.type(titleTextBox, '{del}{del}{del}{del}{del}');
    userEvent.tab();

    expect(onChangeTitle).toHaveBeenCalledTimes(1);
    expect(onChangeTitle).toHaveBeenCalledWith('Light');
  });

  test('shows the event type label if the title does not match the event type title', async () => {
    report.title = 'Report!';
    renderWithWrapper(
      <Header report={report} onChangeTitle={onChangeTitle} />
    );

    const eventTypeLabel = await screen.findByTestId('reportManager-header-eventType');

    expect(eventTypeLabel).toHaveTextContent('Light');
  });

  test('doest not show the event type label if the title matches the event type title', async () => {
    report.title = 'Light';
    renderWithWrapper(
      <Header report={report} onChangeTitle={onChangeTitle} />
    );

    expect((await screen.queryByTestId('reportManager-header-eventType'))).toBeNull();
  });

  test('renders the priority and date values if report is not new', async () => {
    renderWithWrapper(
      <Header report={report} onChangeTitle={onChangeTitle} />
    );

    expect(await screen.findByTestId('reportManager-header-priorityAndDate')).toBeDefined();
  });

  test('does not render the priority and date values if report is new', async () => {
    report.id = undefined;
    renderWithWrapper(
      <Header report={report} onChangeTitle={onChangeTitle} />
    );

    expect(await screen.queryByTestId('reportManager-header-priorityAndDate')).toBeNull();
  });

  test('renders the location jump button if the report has coordinates', async () => {
    renderWithWrapper(
      <Header report={report} onChangeTitle={onChangeTitle} />
    );

    expect(await screen.findByTitle('Jump to this location')).toBeDefined();
  });

  test('does not render the location jump button if the report does not have coordinates', async () => {
    report.geojson.geometry.coordinates = null;
    renderWithWrapper(
      <Header report={report} onChangeTitle={onChangeTitle} />
    );

    expect(await screen.queryByTitle('Jump to this location')).toBeNull();
  });

  test('rendering a small "p" indicator if the report is associated with patrols', async () => {
    const { rerender } = renderWithWrapper(
      <Header report={report} onChangeTitle={onChangeTitle} />
    );

    let reportIcon = await screen.queryByRole('img');
    expect(reportIcon).not.toHaveTextContent('p');

    report.patrols = ['dfasd-x-adfasxf-1'];

    rerender(
      <Header report={report} onChangeTitle={onChangeTitle} />
    );

    reportIcon = await screen.queryByRole('img');
    expect(reportIcon).toHaveTextContent('p');
  });
});
