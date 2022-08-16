import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useLocation, useSearchParams } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import AddReport from '../AddReport';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import ReportManager from './';
import { ReportsTabContext } from '../SideBar/ReportsTab';
import useNavigate from '../hooks/useNavigate';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('../AddReport', () => jest.fn());

jest.mock('../hooks/useNavigate', () => jest.fn());

describe('ReportManager', () => {
  let AddReportMock, navigate, useNavigateMock, store, useLocationMock, useSearchParamsMock;

  beforeEach(() => {
    AddReportMock = jest.fn(() => null);
    AddReport.mockImplementation(AddReportMock);
    useLocationMock = jest.fn(() => ({ pathname: '/reports/new', state: { temporalId: '1234' } }),);
    useLocation.mockImplementation(useLocationMock);
    useSearchParamsMock = jest.fn(() => ([new URLSearchParams({
      reportType: 'd0884b8c-4ecb-45da-841d-f2f8d6246abf',
    })]));
    useSearchParams.mockImplementation(useSearchParamsMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    store = {
      data: {
        subjectStore: {},
        eventStore: {},
        eventTypes,
        patrolTypes,
        eventSchemas: {
          globalSchema: {
            properties: {
              reported_by: {
                enum_ext: [{
                  value: { id: 'Leader 1' },
                }, {
                  value: { id: 'Leader 2' },
                }],
              },
            },
          },
        },
      },
      view: { sideBar: {} },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('redirects to the same route assignin a temporal id in case it is missing', async () => {
    useLocationMock = jest.fn(() => ({ pathname: '/reports/new', search: '?reportType=1234', state: {} }),);
    useLocation.mockImplementation(useLocationMock);

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportManager />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalled();
      expect(navigate.mock.calls[0][0]).toBe('/reports/new?reportType=1234');
      expect(navigate.mock.calls[0][1]).toHaveProperty('replace');
      expect(navigate.mock.calls[0][1]).toHaveProperty('state');
      expect(navigate.mock.calls[0][1].state).toHaveProperty('temporalId');
    });
  });

  test('shows the added report when clicking the add report button', async () => {
    AddReportMock = ({ onAddReport }) => { // eslint-disable-line
      useEffect(() => {
        onAddReport();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null;
    };
    AddReport.mockImplementation(AddReportMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportManager />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const addedReportManager = (await screen.findAllByTestId('reportManagerContainer'))[1];

    expect(addedReportManager).toHaveClass('show');
  });

  test('hides the added report when clicking the cancel button', async () => {
    AddReportMock = ({ onAddReport }) => { // eslint-disable-line react/display-name
      useEffect(() => {
        const formProps = {};
        const reportData = {};
        const reportTypeId = 'd0884b8c-4ecb-45da-841d-f2f8d6246abf';
        onAddReport(formProps, reportData, reportTypeId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null;
    };
    AddReport.mockImplementation(AddReportMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportsTabContext.Provider value={{ loadingEvents: false }}>
            <ReportManager />
          </ReportsTabContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const addedReportManager = (await screen.findAllByTestId('reportManagerContainer'))[1];

    expect(addedReportManager).toHaveClass('show');

    const addedReportCancelButton = (await screen.findAllByText('Cancel'))[1];
    userEvent.click(addedReportCancelButton);

    await waitFor(() => {
      expect(addedReportManager).not.toHaveClass('show');
    });
  });
});
