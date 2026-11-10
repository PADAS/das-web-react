import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ChainedBackend from 'i18next-chained-backend';
import HttpBackend from 'i18next-http-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';

import { SUPPORTED_LANGUAGES } from './constants';

const I18N_FILES_VERSION = '1.93';

const preloadNamespaces = [
  'components',
  'dates',
  'details-view',
  'eula',
  'filters',
  'heatmap',
  'layers',
  'login',
  'map-controls',
  'map-popups',
  'menu-drawer',
  'patrols',
  'reports',
  'schema-form',
  'settings',
  'subjects',
  'top-bar',
  'tracks',
  'user',
  'utils'
];

i18n
  .use(ChainedBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      backends: [
        LocalStorageBackend,
        HttpBackend
      ],
      backendOptions: [{
        expirationTime: 24 * 60 * 60 * 1000 * 7,
        versions: Object.keys(SUPPORTED_LANGUAGES).reduce((accumulator, language) => {
          accumulator[language] = I18N_FILES_VERSION;
          return accumulator;
        }, {}),
      }, {
        queryStringParams: { v: I18N_FILES_VERSION },
      }],
    },
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
    ns: preloadNamespaces,
    react: {
      useSuspense: false,
    },
    // Some translations, such as an event's age prefix, are empty on purpose.
    returnEmptyString: true,
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
  });
