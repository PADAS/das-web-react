import i18next from 'i18next';

export const generateErrorMessageForRequest = (error) => {
  const t = i18next.getFixedT(null, 'utils', 'generateErrorMessageForRequest');

  if (error.response?.status) {
    switch (error.response.status) {
    case 400: {
      return t('badRequest');
    }
    case 403: {
      return t('forbidden');
    }
    case 408: {
      return t('requestTimeout');
    }
    case 429: {
      return t('tooManyRequests');
    }
    case 500: {
      return t('internalServerError');
    }
    case 502: {
      return t('badGateway');
    }
    case 503: {
      return t('serviceUnavailable');
    }
    default: {
      return t('default');
    }
    }
  }

  if (error.request) {
    return t('noResponse');
  }

  return t('noCode');
};
