import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../../../__test-helpers/fixtures/event-types';
import patrolTypes from '../../../__test-helpers/fixtures/patrol-types';
import { mockStore } from '../../../__test-helpers/MockStore';
import NavigationWrapper from '../../../__test-helpers/navigationWrapper';
import { report } from '../../../__test-helpers/fixtures/reports';
import { TrackerContext } from '../../../utils/analytics';

import ReportMenu from './';

jest.mock('../../../ducks/modals', () => ({
  ...jest.requireActual('../../../ducks/modals'),
  addModal: jest.fn(),
}));

describe('Menu report options', () => {
  const saveReport = jest.fn();
  let store, Wrapper, renderWithWrapper;

  beforeEach(() => {
    store = mockStore({
      data: {
        eventTypes,
        patrolTypes,
      },
      view: {
        featureFlagOverrides: {},
      }
    });
  });

  Wrapper = ({ children }) => /* eslint-disable-line react/display-name */
    <Provider store={store}>
      <NavigationWrapper>
        <TrackerContext.Provider value={{ track: jest.fn() }}>
          {children}
        </TrackerContext.Provider>
      </NavigationWrapper>
    </Provider>;

  renderWithWrapper = (Component) => render(Component, { wrapper: Wrapper });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('The kebab menu is being rendered', async () => {
    renderWithWrapper(
      <ReportMenu report={report} reportTitle="Report Title" saveReport={saveReport} />
    );

    expect((await screen.findByTestId('reportMenu-kebab-button'))).toBeDefined();
  });

  test('Shows 2 options for reports that are not linked to a patrol or added to an incident', async () => {
    renderWithWrapper(
      <ReportMenu report={report} reportTitle="Report Title" saveReport={saveReport} />
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    expect((await screen.queryByTestId('reportMenu-add-to-incident'))).toBeDefined();
    expect((await screen.queryByTestId('reportMenu-add-to-patrol'))).toBeDefined();
  });

  test('should not show the incident option if the report is a collection', async () => {
    const collectionReport = { ...report, ...{ is_collection: true } };
    renderWithWrapper(
      <ReportMenu report={collectionReport} reportTitle="Report Title" saveReport={saveReport} />
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    expect((screen.queryByTestId('reportMenu-add-to-incident'))).toBeNull();
    expect((screen.queryByTestId('reportMenu-add-to-patrol'))).toBeDefined();
  });

  test('should not show the incident option if the report belongs to a collection', async () => {
    const reportWithCollection = { ...report, ...{ is_contained_in: [{ type: 'contains', ordernum: null, url: 'https://fake.com', related_event: {} }] } };
    renderWithWrapper(
      <ReportMenu report={reportWithCollection} reportTitle="Report Title" saveReport={saveReport} />
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    expect((screen.queryByTestId('reportMenu-add-to-incident'))).toBeNull();
    expect((screen.queryByTestId('reportMenu-add-to-patrol'))).toBeDefined();
  });

  test('should not show the patrol option if the report belongs to a patrol', async () => {
    const reportWithCollection = { ...report, ...{ patrol_segments: [{}] } };
    renderWithWrapper(
      <ReportMenu report={reportWithCollection} reportTitle="Report Title" saveReport={saveReport} />
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    expect((screen.queryByTestId('reportMenu-add-to-incident'))).toBeDefined();
    expect((screen.queryByTestId('reportMenu-add-to-patrol'))).toBeNull();
  });
});
