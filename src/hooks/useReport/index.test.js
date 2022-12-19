import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import { mockStore } from '../../__test-helpers/MockStore';
import { report } from '../../__test-helpers/fixtures/reports';
import useReport from './';

describe('useReport', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('provides the expected data for a report', async () => {
    const wrapper = ({ children }) => <Provider store={mockStore({ data: { eventTypes } })}>{children}</Provider>;
    const { result } = renderHook(() => useReport(report), { wrapper });

    expect(result.current).toEqual({
      coordinates: [-104.19557197413907, 20.75709101172957],
      displayPriority: 300,
      displayTitle: 'Light',
      eventTypeTitle: 'Light',
    });
  });
});
