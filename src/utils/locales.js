import esLang from 'date-fns/locale/es';
import enUSLang from 'date-fns/locale/en-US';

/** ToDO: Remove nullish operators after issues with import locales are fixed **/
const es = esLang.es ?? esLang;
const enUS = enUSLang.enUS ?? enUSLang;

const dateLocales = {
  es,
  'en-US': enUS // matching en-US language string of i18next
};

export default dateLocales;
