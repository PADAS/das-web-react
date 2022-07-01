import React from 'react';
import { Provider } from 'react-redux';
import { within, render, screen, waitFor } from '@testing-library/react';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { report } from '../../__test-helpers/fixtures/reports';
import { mockStore } from '../../__test-helpers/MockStore';

import DetailsSection from './';

const onReportedByChange = jest.fn();
const track = jest.fn();
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
describe('DetailsSection', () => {
  describe('Tracked by input', () => {
    test('it should show the field empty for reports without tracking subject', async () => {
      render(<Provider store={mockStore(store)}>
        <DetailsSection
          report={report}
          onReportedByChange={onReportedByChange}
          reportTracker={{ track }}
        />
      </Provider>);

      const reportedBySelect = await screen.getByTestId('reported-by-select');
      const placeholderText = within(reportedBySelect).queryByText('Reported by...');

      expect(() => within(reportedBySelect).getByTestId('select-single-value')).toThrow();
      expect(placeholderText).toBeDefined();
    });

    test('it should show the name of the tracking subject for saved reports', async () => {
      report.reported_by = {
        id: '1234',
        name: 'Canek',
        image_url: '/static/ranger-black.svg'
      };

      render(<Provider store={mockStore(store)}>
        <DetailsSection
          report={report}
          onReportedByChange={onReportedByChange}
          reportTracker={{ track }}
        />
      </Provider>);

      const reportedBySelect = await screen.getByTestId('reported-by-select');
      const reportReportedInput = await within(reportedBySelect).getByTestId('select-single-value');

      const selectionImage = reportReportedInput.children[0];
      const selectionText = reportReportedInput.children[1];

      await waitFor(() => {
        expect(within(reportedBySelect).queryByText('Reported by...')).toBeNull();
        expect(selectionImage).toHaveAttribute('alt', 'Radio icon for Canek value');
        expect(selectionText).toHaveTextContent('Canek');
      });


    });
  });
});
