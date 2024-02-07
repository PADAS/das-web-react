import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import datesEnUS from '../public/locales/en-US/dates.json';
import detailsViewEnUS from '../public/locales/en-US/details-view.json';
import loginEnUS from '../public/locales/en-US/login.json';
import mapControlsEnUS from '../public/locales/en-US/map-controls.json';
import mapPopupsEnUS from '../public/locales/en-US/map-popups.json';
import menuDrawerEnUS from '../public/locales/en-US/menu-drawer.json';
import patrolsEnUS from '../public/locales/en-US/patrols.json';
import reportsEnUS from '../public/locales/en-US/reports.json';
import settingsEnUS from '../public/locales/en-US/settings.json';
import sideBarEnUS from '../public/locales/en-US/side-bar.json';
import subjectsEnUS from '../public/locales/en-US/subjects.json';

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
        'dates': datesEnUS,
        'details-view': detailsViewEnUS,
        'login': loginEnUS,
        'map-controls': mapControlsEnUS,
        'map-popups': mapPopupsEnUS,
        'menu-drawer': menuDrawerEnUS,
        'patrols': patrolsEnUS,
        'reports': reportsEnUS,
        'settings': settingsEnUS,
        'side-bar': sideBarEnUS,
        'subjects': subjectsEnUS,
      },
    },
  });

export default i18n;
