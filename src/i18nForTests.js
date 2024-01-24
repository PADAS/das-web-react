import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import loginEnUS from '../public/locales/en-US/login.json';
import sideBarEnUS from '../public/locales/en-US/side-bar.json';
import detailsView from '../public/locales/en-US/details-view.json';

i18n
  .use(initReactI18next)
  .init({
    lng: 'en-US',
    fallbackLng: 'en-US',

    interpolation: {
      escapeValue: false, // not needed for react!!
    },

    resources: {
      'en-US': {
        'login': loginEnUS,
        'side-bar': sideBarEnUS,
        'details-view': detailsView,
      },
    },
  });

export default i18n;
