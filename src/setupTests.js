import ReactGA from 'react-ga';
import 'jest-webgl-canvas-mock';
import '@testing-library/jest-dom/extend-expect';

import MockSocketContext, { SocketContext } from './__test-helpers/MockSocketContext';


ReactGA.initialize('dummy', { testMode: true });

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

window.URL.createObjectURL = jest.fn();

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