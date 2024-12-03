import '@testing-library/jest-dom/extend-expect';
import 'jest-webgl-canvas-mock';
import { fetch, FormData, Headers, Response, Request } from 'undici';
import ReactGA4 from 'react-ga4';
import { ReadableStream, TransformStream } from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'node:util';

import MockSocketContext, { SocketContext } from './__test-helpers/MockSocketContext';

ReactGA4.initialize('dummy', { testMode: true });

Object.defineProperties(global, {
  Blob: { value: Blob },
  fetch: { value: fetch, writable: true },
  File: { value: File },
  FormData: { value: FormData },
  Headers: { value: Headers },
  ReadableStream: { value: ReadableStream },
  Response: { value: Response },
  Request: { value: Request },
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  TransformStream: { value: TransformStream },
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.defineProperty(navigator, 'languages', { get: () => ['en-US'] });

jest.doMock('./withSocketConnection', () => ({
  SocketContext,
  default: MockSocketContext,
}));

global.console = {
  log: console.log,
  error: jest.fn(),
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

global.IntersectionObserver = class IntersectionObserver {
  disconnect = jest.fn();
  observe = jest.fn();
  takeRecords = jest.fn();
  unobserve = jest.fn();
};

global.BroadcastChannel = require('worker_threads').BroadcastChannel;

window.URL.createObjectURL = jest.fn();

process.env.REACT_APP_EFB_FORM_SCHEMA_SUPPORT_ENABLED = false;
