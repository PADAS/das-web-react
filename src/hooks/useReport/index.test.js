import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';

import { renderHook } from '../../test-utils';
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

  const wrapper = ({ children }) => <Provider store={mockStore({ data: { eventTypes } })}>
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <NavigationContextProvider>
          {children}
        </NavigationContextProvider>
      </MemoryRouter>
    </I18nextProvider>
  </Provider>;

  const renderUseReport = (event) => renderHook(() => useReport(event), { wrapper }).result.current;

  test('provides the expected data for an event', async () => {
    expect(renderUseReport(report)).toEqual({
      coordinates: [-104.19557197413907, 20.75709101172957],
      displayPriority: 300,
      displaySubtitle: null,
      displayTitle: 'Light',
      eventTypeTitle: 'Light',
    });
  });

  test('titles an event without a title after its type, without repeating the type below', async () => {
    expect(renderUseReport({ ...report, title: null }).displayTitle).toBe('Light');
    expect(renderUseReport({ ...report, title: null }).displaySubtitle).toBeNull();
    expect(renderUseReport({ ...report, title: '  ' }).displayTitle).toBe('Light');
    expect(renderUseReport({ ...report, title: '  ' }).displaySubtitle).toBeNull();
  });

  test('does not repeat the type below a title that is the type', async () => {
    expect(renderUseReport({ ...report, title: 'Light' }).displaySubtitle).toBeNull();
  });

  test('shows the type below a title of its own', async () => {
    expect(renderUseReport({ ...report, title: 'Broken fence light' }).displayTitle).toBe('Broken fence light');
    expect(renderUseReport({ ...report, title: 'Broken fence light' }).displaySubtitle).toBe('Light');
  });
});
