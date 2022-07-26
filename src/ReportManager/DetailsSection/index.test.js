import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import { mockStore } from '../../__test-helpers/MockStore';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { report } from '../../__test-helpers/fixtures/reports';

import DetailsSection from './';

const onReportedByChange = jest.fn();
const store = {
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
              value: {
                id: '1234',
                name: 'Canek',
                subject_type: 'person',
                subject_subtype: 'ranger',
                is_active: true,
                image_url: '/static/ranger-black.svg'
              }
            }],
          },
        },
      },
    }
  },
  view: { sideBar: {} },
};

describe('ReportManager - DetailsSection', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the field empty for reports without tracking subject', async () => {
    render(
      <Provider store={mockStore(store)}>
        <DetailsSection onReportedByChange={onReportedByChange} reportedBy={report.reported_by} />
      </Provider>
    );

    const reportedBySelect = await screen.getByTestId('reportManager-reportedBySelect');
    const placeholderText = within(reportedBySelect).queryByText('Reported by...');

    expect(() => within(reportedBySelect).getByTestId('select-single-value')).toThrow();
    expect(placeholderText).toBeDefined();
  });

  test('shows the name of the tracking subject for saved reports', async () => {
    const reportedBy = {
      id: '1234',
      name: 'Canek',
      image_url: '/static/ranger-black.svg'
    };

    render(
      <Provider store={mockStore(store)}>
        <DetailsSection onReportedByChange={onReportedByChange} reportedBy={reportedBy} />
      </Provider>
    );

    const reportedBySelect = await screen.getByTestId('reportManager-reportedBySelect');
    const reportReportedInput = await within(reportedBySelect).getByTestId('select-single-value');

    const selectionImage = reportReportedInput.children[0];
    const selectionText = reportReportedInput.children[1];

    await waitFor(() => {
      expect(within(reportedBySelect).queryByText('Reported by...')).toBeNull();
      expect(selectionImage).toHaveAttribute('alt', 'Radio icon for Canek value');
      expect(selectionText).toHaveTextContent('Canek');
    });
  });

  test('triggers the onReportedByChange callback when the user selects a subject', async () => {
    const reportedBy = {
      id: '1234',
      name: 'Canek',
      image_url: '/static/ranger-black.svg'
    };

    render(
      <Provider store={mockStore(store)}>
        <DetailsSection onReportedByChange={onReportedByChange} reportedBy={reportedBy} />
      </Provider>
    );

    const reportedBySelect = await screen.getByTestId('reportManager-reportedBySelect');
    const reportReportedInput = await within(reportedBySelect).getByTestId('select-single-value');
    userEvent.click(reportReportedInput);

    expect(onReportedByChange).toHaveBeenCalledTimes(0);

    const reporterOption = await screen.getByAltText('Radio icon for Canek option');
    userEvent.click(reporterOption);

    expect(onReportedByChange).toHaveBeenCalledTimes(1);
    expect(onReportedByChange.mock.calls[0][0].id).toBe('1234');
  });
});
