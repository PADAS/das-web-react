import React from 'react';
import { useTranslation } from 'react-i18next';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../test-utils';

import LanguageSelect from './';

jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: jest.fn(),
}));

describe('SideBar - SettingsPane - GeneralTab - LanguageSelect', () => {
  const changeLanguage = jest.fn();

  beforeEach(() => {
    useTranslation.mockImplementation(() => ({ i18n: { changeLanguage }, t: (key) => key }));
  });

  const renderLanguageSelect = (props) => render(<LanguageSelect {...props} />);

  test('changes the i18n language when the user selects a new one', async () => {
    renderLanguageSelect();

    const languageSelect = screen.getByRole('combobox', { name: 'label' });

    expect(changeLanguage).not.toHaveBeenCalled();

    await userEvent.click(languageSelect);
    await userEvent.click(screen.getByRole('option', { name: 'Español' }));

    expect(changeLanguage).toHaveBeenCalledTimes(1);
    expect(changeLanguage).toHaveBeenCalledWith('es');

    await userEvent.click(languageSelect);
    await userEvent.click(screen.getByRole('option', { name: 'Swahili' }));

    expect(changeLanguage).toHaveBeenCalledTimes(2);
    expect(changeLanguage).toHaveBeenCalledWith('sw');
  });
});
