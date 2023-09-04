import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { useReactToPrint } from 'react-to-print';
import userEvent from '@testing-library/user-event';

import { addModal } from '../../../ducks/modals';
import { eventTypes } from '../../../__test-helpers/fixtures/event-types';
import patrolTypes from '../../../__test-helpers/fixtures/patrol-types';
import { mockStore } from '../../../__test-helpers/MockStore';
import NavigationWrapper from '../../../__test-helpers/navigationWrapper';
import { report } from '../../../__test-helpers/fixtures/reports';
import { TrackerContext } from '../../../utils/analytics';

import ReportMenu from './';

jest.mock('react-to-print', () => ({
  ...jest.requireActual('react-to-print'),
  useReactToPrint: jest.fn(),
}));

jest.mock('../../../ducks/modals', () => ({
  ...jest.requireActual('../../../ducks/modals'),
  addModal: jest.fn(),
}));

describe('Menu report options', () => {
  const handlePrint = jest.fn();
  const onSaveReport = jest.fn();
  const setRedirectTo = jest.fn();
  let addModalMock, store, Wrapper, renderWithWrapper, useReactToPrintMock;

  beforeEach(() => {
    addModalMock = jest.fn(() => () => {});
    addModal.mockImplementation(addModalMock);
    useReactToPrintMock = jest.fn(() => handlePrint);
    useReactToPrint.mockImplementation(useReactToPrintMock);

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

  test('prints the report when the user clicks Print Report button', async () => {
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={report}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    expect(handlePrint).toHaveBeenCalledTimes(0);

    const printReportButton = await screen.getByText('Print Report');
    userEvent.click(printReportButton);

    expect(handlePrint).toHaveBeenCalledTimes(1);
  });

  test('should not show the incident option if the report is a collection', async () => {
    const collectionReport = { ...report, ...{ is_collection: true } };
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={collectionReport}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    expect((screen.queryByText('Add to Incident'))).toBeNull();
    expect((screen.queryByText('Add to Parol'))).toBeDefined();
  });

  test('should not show the incident option if the report belongs to a collection', async () => {
    const reportWithCollection = { ...report, ...{ is_contained_in: [{ type: 'contains', ordernum: null, url: 'https://fake.com', related_event: {} }] } };
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={reportWithCollection}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    expect((screen.queryByText('Add to Incident'))).toBeNull();
    expect((screen.queryByText('Add to Parol'))).toBeDefined();
  });

  test('shows the add to incident option and shows the incident modal when clicking it', async () => {
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={report}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    const addToIncidentButton = await screen.findByText('Add to Incident');

    expect(addToIncidentButton).toBeDefined();

    userEvent.click(addToIncidentButton);

    expect(addModal).toHaveBeenCalledTimes(1);
  });

  test('should not show the patrol option if the report belongs to a patrol', async () => {
    const patrolReport = { ...report, ...{ patrol_segments: [{}] } };
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={patrolReport}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    expect((screen.queryByText('Add to Incident'))).toBeDefined();
    expect((screen.queryByText('Add to Patrol'))).toBeNull();
  });

  test('shows the add to patrol option and shows the patrol modal when clicking it', async () => {
    renderWithWrapper(
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={{ current: <div>Printable report</div> }}
        report={report}
        reportTitle="Report Title"
        setRedirectTo={setRedirectTo}
      />
    );

    const kebabButton = await screen.findByTestId('reportMenu-kebab-button');
    userEvent.click(kebabButton);

    const addToPatrolButton = await screen.findByText('Add to Patrol');

    expect(addToPatrolButton).toBeDefined();

    userEvent.click(addToPatrolButton);

    expect(addModal).toHaveBeenCalledTimes(1);
  });
});
