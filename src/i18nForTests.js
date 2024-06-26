import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import componentsEnUS from '../public/locales/en-US/components.json';
import datesEnUS from '../public/locales/en-US/dates.json';
import detailsViewEnUS from '../public/locales/en-US/details-view.json';
import filtersEnUS from '../public/locales/en-US/filters.json';
import heatmapEnUS from '../public/locales/en-US/heatmap.json';
import loginEnUS from '../public/locales/en-US/login.json';
import mapControlsEnUS from '../public/locales/en-US/map-controls.json';
import mapPopupsEnUS from '../public/locales/en-US/map-popups.json';
import menuDrawerEnUS from '../public/locales/en-US/menu-drawer.json';
import patrolsEnUS from '../public/locales/en-US/patrols.json';
import reportsEnUS from '../public/locales/en-US/reports.json';
import settingsEnUS from '../public/locales/en-US/settings.json';
import subjectsEnUS from '../public/locales/en-US/subjects.json';
import topBarEnUS from '../public/locales/en-US/top-bar.json';
import utilsEnUS from '../public/locales/en-US/utils.json';

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
        'components': componentsEnUS,
        'dates': datesEnUS,
        'details-view': detailsViewEnUS,
        'filters': filtersEnUS,
        'heatmap': heatmapEnUS,
        'login': loginEnUS,
        'map-controls': mapControlsEnUS,
        'map-popups': mapPopupsEnUS,
        'menu-drawer': menuDrawerEnUS,
        'patrols': patrolsEnUS,
        'reports': reportsEnUS,
        'settings': settingsEnUS,
        'subjects': subjectsEnUS,
        'top-bar': topBarEnUS,
        'utils': utilsEnUS,
      },
    },
  });

export default i18n;
