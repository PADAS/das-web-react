import '../i18nForTests';
import utilsEnUS from '../../public/locales/en-US/utils.json';

import { generateErrorMessageForRequest } from './request';

const messages = utilsEnUS.generateErrorMessageForRequest;

describe('generateErrorMessageForRequest', () => {
  test('returns the tooManyRequests message for a numeric 429 response', () => {
    expect(generateErrorMessageForRequest({ response: { status: 429 } })).toBe(messages.tooManyRequests);
  });

  test('returns the tooManyRequests message for an object 429 response with status.code', () => {
    expect(generateErrorMessageForRequest({ response: { status: { code: 429 } } })).toBe(messages.tooManyRequests);
  });

  test('returns the tooManyRequests message for a body 429 response with data.status.code', () => {
    expect(generateErrorMessageForRequest({ response: { data: { status: { code: 429 } } } })).toBe(messages.tooManyRequests);
  });

  test('returns the serviceUnavailable message for a body 503 response with data.status.code', () => {
    expect(generateErrorMessageForRequest({ response: { data: { status: { code: 503 } } } })).toBe(messages.serviceUnavailable);
  });

  test('returns the badRequest message for a numeric 400 response', () => {
    expect(generateErrorMessageForRequest({ response: { status: 400 } })).toBe(messages.badRequest);
  });

  test('returns the internalServerError message for a numeric 500 response', () => {
    expect(generateErrorMessageForRequest({ response: { status: 500 } })).toBe(messages.internalServerError);
  });

  test('returns the internalServerError message for an object 500 response with status.code', () => {
    expect(generateErrorMessageForRequest({ response: { status: { code: 500 } } })).toBe(messages.internalServerError);
  });

  test('returns the tooManyRequests message when the body status.code takes precedence over a numeric status', () => {
    expect(generateErrorMessageForRequest({ response: { data: { status: { code: 429 } }, status: 500 } })).toBe(messages.tooManyRequests);
  });

  test('returns the noResponse message for an error with only a request and no response', () => {
    expect(generateErrorMessageForRequest({ request: {} })).toBe(messages.noResponse);
  });

  test('returns the tooManyRequests message for an axios-style 429 with both request and response set', () => {
    const axiosError = { request: {}, response: { status: 429 } };

    expect(generateErrorMessageForRequest(axiosError)).toBe(messages.tooManyRequests);
  });

  test('returns the noCode message for an error with neither request nor response', () => {
    expect(generateErrorMessageForRequest({})).toBe(messages.noCode);
  });
});
