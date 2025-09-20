import React from 'react';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';

import { SETTINGS_CATEGORY, trackEventFactory } from '../../../../utils/analytics';
import { SUPPORTED_LANGUAGES } from '../../../../constants';

import * as styles from '../../styles.module.scss';

const settingsTracker = trackEventFactory(SETTINGS_CATEGORY);

const LANGUAGE_OPTIONS = Object.entries(SUPPORTED_LANGUAGES).reduce(
  (accumulator, [value, label]) => [...accumulator, { label, value }],
  []
);

const LanguageSelect = () => {
  const { i18n, t } = useTranslation('components', { keyPrefix: 'sideBar.settingsPane.generalTab.languageSelect' });

  const onLanguageChange = (language) => {
    i18n.changeLanguage(language.value);

    settingsTracker.track(`Change language to ${language.label}`);
  };

  return <div className={styles.section}>
    <label className={styles.title} htmlFor="language-select-input">{t('label')}</label>

    <Select
      inputId="language-select-input"
      onChange={onLanguageChange}
      options={LANGUAGE_OPTIONS}
      value={LANGUAGE_OPTIONS.find((languageOption) => languageOption.value === i18n.language)}
    />
  </div>;
};

export default LanguageSelect;
