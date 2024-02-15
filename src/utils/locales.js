import esLang from 'date-fns/locale/es';
import enUSLang from 'date-fns/locale/en-US';

const es = esLang.es ?? esLang;
const enUS = enUSLang.enUS ?? enUSLang;

const dateLocales = {
  es,
  'en-US': enUS // matching en-US language string of i18next
};

export default dateLocales;
