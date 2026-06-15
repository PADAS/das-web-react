import '../i18nForTests';
import utilsEnUS from '../../public/locales/en-US/utils.json';

import { generateErrorMessageForRequest } from './request';

const messages = utilsEnUS.generateErrorMessageForRequest;

describe('generateErrorMessageForRequest', () => {
  test('returns the tooManyRequests message for a 429 response', () => {
    expect(generateErrorMessageForRequest({ response: { status: 429 } })).toBe(messages.tooManyRequests);
  });

  test('returns the badRequest message for a 400 response', () => {
    expect(generateErrorMessageForRequest({ response: { status: 400 } })).toBe(messages.badRequest);
  });

  test('returns the internalServerError message for a 500 response', () => {
    expect(generateErrorMessageForRequest({ response: { status: 500 } })).toBe(messages.internalServerError);
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
