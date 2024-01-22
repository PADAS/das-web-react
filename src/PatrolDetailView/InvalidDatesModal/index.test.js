import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';

import InvalidDatesModal from './';
import i18nForTests from '../../i18nForTests';

describe('InvalidDatesModal', () => {
  const onHide = jest.fn();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers onHide the modal when  user clicks Ok', async () => {
    render(
      <I18nextProvider i18n={i18nForTests}>
        <InvalidDatesModal onHide={onHide} show />
      </I18nextProvider>
    );

    expect(onHide).toHaveBeenCalledTimes(0);

    const okButton = await screen.findByText('OK');
    userEvent.click(okButton);

    expect(onHide).toHaveBeenCalledTimes(1);
  });
});
