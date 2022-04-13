import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import { mockStore } from '../../__test-helpers/MockStore';
import { report } from '../../__test-helpers/fixtures/reports';
import useReport from './';

describe('useReport', () => {
  const Component = ({ report }) => {
    const data = useReport(report);

    return <p data-testid="report-data">{JSON.stringify(data)}</p>;
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('provides the expected data for a report', async () => {
    render(
      <Provider store={mockStore({ data: { eventTypes } })}>
        <Component report={report} />
      </Provider>
    );

    expect((await screen.findByTestId('report-data'))).toHaveTextContent('{"title":"Light"}');
  });
});
