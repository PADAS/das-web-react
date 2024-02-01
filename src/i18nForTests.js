import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import loginEnUS from '../public/locales/en-US/login.json';
import mapPopupsEnUS from '../public/locales/en-US/map-popups.json';
import menuDrawerEnUS from '../public/locales/en-US/menu-drawer.json';
import reportsEnUS from '../public/locales/en-US/reports.json';
import settingsEnUS from '../public/locales/en-US/settings.json';
import sideBarEnUS from '../public/locales/en-US/side-bar.json';
import patrolsEnUS from '../public/locales/en-US/patrols.json';
import datesEnUS from '../public/locales/en-US/dates.json';
import detailsView from '../public/locales/en-US/details-view.json';
import mapControls from '../public/locales/en-US/map-controls.json';


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
        'map-popups': mapPopupsEnUS,
        'menu-drawer': menuDrawerEnUS,
        'reports': reportsEnUS,
        'settings': settingsEnUS,
        'side-bar': sideBarEnUS,
        'patrols': patrolsEnUS,
        'dates': datesEnUS,
        'details-view': detailsView,
        'map-controls': mapControls,
      },
    },
  });

export default i18n;
