import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import datesEnUS from '../public/locales/en-US/dates.json';
import detailsViewEnUS from '../public/locales/en-US/details-view.json';
import ducksEnUS from '../public/locales/en-US/ducks.json';
import filters from '../public/locales/en-US/filters.json';
import loginEnUS from '../public/locales/en-US/login.json';
import mapControlsEnUS from '../public/locales/en-US/map-controls.json';
import mapPopupsEnUS from '../public/locales/en-US/map-popups.json';
import menuDrawerEnUS from '../public/locales/en-US/menu-drawer.json';
import patrolsEnUS from '../public/locales/en-US/patrols.json';
import reportsEnUS from '../public/locales/en-US/reports.json';
import settingsEnUS from '../public/locales/en-US/settings.json';
import sideBarEnUS from '../public/locales/en-US/side-bar.json';
import subjectsEnUS from '../public/locales/en-US/subjects.json';
import topBarEnUS from '../public/locales/en-US/top-bar.json';

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
        'ducks': ducksEnUS,
        'filters': filters,
        'login': loginEnUS,
        'map-controls': mapControlsEnUS,
        'map-popups': mapPopupsEnUS,
        'menu-drawer': menuDrawerEnUS,
        'patrols': patrolsEnUS,
        'reports': reportsEnUS,
        'settings': settingsEnUS,
        'side-bar': sideBarEnUS,
        'subjects': subjectsEnUS,
        'top-bar': topBarEnUS,
      },
    },
  });

export default i18n;
