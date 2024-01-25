import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import i18n from '../../i18nForTests';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationContextProvider from '../../NavigationContextProvider';
import { report } from '../../__test-helpers/fixtures/reports';
import useReport from './';

describe('useReport', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('provides the expected data for a report', async () => {
    const wrapper = ({ children }) => <Provider store={mockStore({ data: { eventTypes } })}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <NavigationContextProvider>
            {children}
          </NavigationContextProvider>
        </MemoryRouter>
      </I18nextProvider>
    </Provider>;
    const { result } = renderHook(() => useReport(report), { wrapper });

    expect(result.current).toEqual({
      coordinates: [-104.19557197413907, 20.75709101172957],
      displayPriority: 300,
      displayTitle: 'Light',
      eventTypeTitle: 'Light',
    });
  });
});
