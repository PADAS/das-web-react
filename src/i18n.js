import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-chained-backend';
import resourcesToBackend from 'i18next-resources-to-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';
import { SUPPORTED_LANGUAGES } from './constants';

const preloadNamespaces = [ 'dates', 'details-view', 'eula', 'filters', 'layers', 'login', 'map-controls', 'map-legends', 'map-popups', 'menu-drawer', 'patrols', 'reports', 'settings', 'side-bar', 'subjects', 'top-bar', 'tracks'];

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
    react: {
      useSuspense: true,
    },
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    preload: Object.keys(SUPPORTED_LANGUAGES),
    ns: preloadNamespaces,
    backend: {
      backends: [
        LocalStorageBackend,
        resourcesToBackend((lang, namespace, callback) => {
          import(`/public/locales/${lang}/${namespace}.json`)
            .then(resources => callback(null, resources))
            .catch(error => callback(error, null));
        })
      ],
      backendOptions: [{
        expirationTime: 24 * 60 * 60 * 1000 * 7, // 7 days
        defaultVersion: 'v1'
      }]
    }
  });
