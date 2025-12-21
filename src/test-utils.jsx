// https://testing-library.com/docs/react-testing-library/setup/#custom-render

import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { render } from '@testing-library/react';

import i18n from './i18nForTests';
import NavigationContextProvider from './NavigationContextProvider';

const createWrapper = ({ initialEntries } = {}) => {
  /* eslint-disable-next-line react/display-name */
  return ({ children }) => (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={initialEntries || ['/']}>
        <NavigationContextProvider>
          {children}
        </NavigationContextProvider>
      </MemoryRouter>
    </I18nextProvider>
  );
};

const customRender = (ui, { initialEntries, ...options } = {}) =>
  render(ui, { wrapper: createWrapper({ initialEntries }), ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
