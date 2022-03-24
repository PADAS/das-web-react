const errorHasAResponse = error => !!error.response;
const errorHasAResponseStatusCode = error => errorHasAResponse(error) && !!error.response.status && !!error.response.status.code;

export const errorIsHttpError = error => errorHasAResponseStatusCode(error) && error.response.status >= 400 && error.response.status <= 499;
export const errorIsServerError = error => errorHasAResponseStatusCode(error) && error.response.status >= 500 && error.response.status <= 599;

const errorIsRequestError = error => !!error.request; // aka trouble communicating with the server, probably a network outage

export const generateErrorMessageForRequest = (error) => {
  if (errorIsRequestError(error)) return 'No response from the server.';
  if (errorHasAResponseStatusCode(error)) {
    switch (error.response.status.code) {
    case 400: {
      return 'Bad request issued. Please contact your administrator (400).';
    }
    case 403: {
      return 'Request denied. Please contact your administrator (403).';
    }
    case 408: {
      return 'Request timed out. Please try again (408).';
    }
    case 429: {
      return 'Too many requests. Please try again later, and contact your administrator if this problem persists. (429)';
    }
    case 500: {
      return 'Internal server error. Please try again later, and contact your administrator if this problem persists. (500)';
    }
    case 502: {
      return 'Bad gateway. Please try again later, and contact your administrator if this problem persists. (502)';
    }
    case 503: {
      return 'The requested resource is currently unavailable. Please try again later, and contact your administrator if this problem persists. (503)';
    }
    default: {
      return 'There was an error handling your request.';
    }
    }
  }
  return 'Your request failed to send. Please try again later, and contact your administrator if this problem persists.';
};

// 400 bad req
// 401 unauthorized
// 403 forbidden
// 408 timeout
// 429 too many requests

// 500 internal server error
// 502 bad gateway
// 503 service unavailable
