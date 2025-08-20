import '@testing-library/jest-dom';
import 'jest-webgl-canvas-mock';
import ReactGA4 from 'react-ga4';

import MockSocketContext, { SocketContext } from './__test-helpers/MockSocketContext';

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

global.BroadcastChannel = require('worker_threads').BroadcastChannel;

global.structuredClone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

window.URL.createObjectURL = jest.fn();

process.env.REACT_APP_CUSTOM_COORDINATE_SYSTEMS_ENABLED = true;
