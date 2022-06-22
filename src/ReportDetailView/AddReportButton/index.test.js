import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddReportButton from './';
import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import { mockStore } from '../../__test-helpers/MockStore';

describe('ReportDetailView - AddReportButton', () => {
  const onAddReport = jest.fn();
  let store;
  beforeEach(() => {
    store = { data: { eventTypes }, view: {} };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the add report popover if user clicks the add report button', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <AddReportButton onAddReport={onAddReport} />
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.queryByText('Add Report'))).toBeNull();

    const addReportButton = await screen.findByTestId('reportDetailView-addReportButton');
    userEvent.click(addReportButton);

    expect((await screen.findByText('Add Report'))).toBeDefined();
  });
});
