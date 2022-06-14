import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { addModal } from '../../../ducks/modals';
import { eventTypes } from '../../../__test-helpers/fixtures/event-types';
import patrolTypes from '../../../__test-helpers/fixtures/patrol-types';
import { mockStore } from '../../../__test-helpers/MockStore';
import NavigationWrapper from '../../../__test-helpers/navigationWrapper';
import { report } from '../../../__test-helpers/fixtures/reports';
import AddToIncidentModal from '../../../ReportForm/AddToIncidentModal';

import ReportMenu from './';

jest.mock('../../../ducks/modals', () => ({
  ...jest.requireActual('../../../ducks/modals'),
  addModal: jest.fn(),
}));

describe('Menu report options', () => {
  const saveReport = jest.fn();
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('The kebab menu is being rendered', async () => {
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <ReportMenu report={report} saveReport={saveReport} />
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findByTestId('reportMenu-kebab-button'))).toBeDefined();
  });

  test('Shows 2 options for reports that are not linked to a patrol or added to an incident', async () => {
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <ReportMenu report={report} saveReport={saveReport} />
        </NavigationWrapper>
      </Provider>
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    expect((await screen.queryByTestId('reportMenu-add-to-incident'))).toBeDefined();
    expect((await screen.queryByTestId('reportMenu-add-to-patrol'))).toBeDefined();
  });

  test('should not show the incident option if the report is a collection', async () => {
    const collectionReport = { ...report, ...{ is_collection: true } };
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <ReportMenu report={collectionReport} saveReport={saveReport} />
        </NavigationWrapper>
      </Provider>
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    expect((screen.queryByTestId('reportMenu-add-to-incident'))).toBeNull();
    expect((screen.queryByTestId('reportMenu-add-to-patrol'))).toBeDefined();
  });

  test('should not show the incident option if the report belongs to a collection', async () => {
    const reportWithCollection = { ...report, ...{ is_contained_in: [{ type: 'contains', ordernum: null, url: 'https://fake.com', related_event: {} }] } };
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <ReportMenu report={reportWithCollection} saveReport={saveReport} />
        </NavigationWrapper>
      </Provider>
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    expect((screen.queryByTestId('reportMenu-add-to-incident'))).toBeNull();
    expect((screen.queryByTestId('reportMenu-add-to-patrol'))).toBeDefined();
  });

  test('should not show the patrol option if the report belongs to a patrol', async () => {
    const reportWithCollection = { ...report, ...{ patrols: ['f60d2f14-dc57-48a8-8258-88877982cc45'] } };
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <ReportMenu report={reportWithCollection} saveReport={saveReport} />
        </NavigationWrapper>
      </Provider>
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    expect((screen.queryByTestId('reportMenu-add-to-incident'))).toBeDefined();
    expect((screen.queryByTestId('reportMenu-add-to-patrol'))).toBeNull();
  });

  test('should not show the kebab button if a report belongs to a patrol and collection', async () => {
    const reportWithCollection = { ...report, ...{ patrols: ['f60d2f14-dc57-48a8-8258-88877982cc45'] }, ...{ is_collection: true } };
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <ReportMenu report={reportWithCollection} saveReport={saveReport} />
        </NavigationWrapper>
      </Provider>
    );

    expect((screen.queryByTestId('reportMenu-kebab-button'))).toBeNull();
  });
});

describe('click on options', () => {
  let addModalMock;
  const saveReport = jest.fn();
  afterEach(() => {
    addModalMock = jest.fn(() => () => {});
    addModal.mockImplementation(addModalMock);
    jest.restoreAllMocks();
  });

  test('renders incident modal on incident option clicked', async () => {
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <ReportMenu report={report} saveReport={saveReport} />
        </NavigationWrapper>
      </Provider>
    );

    expect(addModal).toHaveBeenCalledTimes(0);

    const kebabButton = await (await screen.findByTestId('reportMenu-kebab-button'));
    userEvent.click(kebabButton);

    const incidentOption = await screen.queryByTestId('reportMenu-add-to-incident');
    userEvent.click(incidentOption);

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0]).toHaveProperty('onAddToNewIncident');
  });

  test('renders patrol modal on patrol option clicked', async () => {
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <ReportMenu report={report} saveReport={saveReport} />
        </NavigationWrapper>
      </Provider>
    );

    expect(addModal).toHaveBeenCalledTimes(0);

    const kebabButton = await (await screen.findByTestId('reportMenu-kebab-button'));
    userEvent.click(kebabButton);

    const incidentOption = await screen.queryByTestId('reportMenu-add-to-patrol');
    userEvent.click(incidentOption);

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0]).toHaveProperty('onAddToPatrol');
  });
});
