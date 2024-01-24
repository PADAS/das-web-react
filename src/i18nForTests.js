import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import loginEnUS from '../public/locales/en-US/login.json';
import reportsEnUS from '../public/locales/en-US/reports.json';
import sideBarEnUS from '../public/locales/en-US/side-bar.json';
import patrolsEnUS from '../public/locales/en-US/patrols.json';
import datesEnUS from '../public/locales/en-US/dates.json';

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
        'reports': reportsEnUS,
        'side-bar': sideBarEnUS,
        'patrols': patrolsEnUS,
        'dates': datesEnUS,
      },
    },
  });

export default i18n;
