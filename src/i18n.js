import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ChainedBackend from 'i18next-chained-backend';
import HttpBackend from 'i18next-http-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';
import { SUPPORTED_LANGUAGES } from './constants';

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
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
    react: {
      useSuspense: false,
    },
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    ns: preloadNamespaces,
    backend: {
      backends: [
        LocalStorageBackend,
        HttpBackend
      ],
      backendOptions: [{
        expirationTime: 24 * 60 * 60 * 1000 * 7,
        defaultVersion: 'v1.0',
        versions: {
          es: '1.0',
          'en-US': '1.0',
          fr: '1.0',
          'ne-NP': '1.0.',
          pt: '1.0',
          sw: '1.0.1'
        }
      }]
    }
  });
