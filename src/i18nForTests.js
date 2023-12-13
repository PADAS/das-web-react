import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import loginEn from '../public/locales/en/login.json';
import sideBarEn from '../public/locales/en/side-bar.json';

i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false, // not needed for react!!
    },

    resources: {
      en: {
        'login': loginEn,
        'side-bar': sideBarEn,
      },
    },
  });

export default i18n;
