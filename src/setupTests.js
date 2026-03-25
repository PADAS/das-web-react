import '@testing-library/jest-dom';
import 'jest-webgl-canvas-mock';
import dotenv from 'dotenv';
import ReactGA4 from 'react-ga4';

import MockSocketContext, { SocketContext } from './__test-helpers/MockSocketContext';

// Set test environment variables.
dotenv.config({ quiet: true });
process.env.MODE = 'test';
process.env.DEV = 'true';
process.env.PROD = '';
process.env.BASE_URL = '/';

ReactGA4.initialize('dummy', { testMode: true });

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
