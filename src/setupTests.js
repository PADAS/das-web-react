import ReactGA from 'react-ga';
import 'jest-webgl-canvas-mock';
import '@testing-library/jest-dom/extend-expect';
import mapboxgl from 'mapbox-gl';

import MockSocketContext, { SocketContext } from './__test-helpers/MockSocketContext';
import { createMapMock, createMockPopup } from './__test-helpers/mocks';

ReactGA.initialize('dummy', { testMode: true });

jest.mock('mapbox-gl', () => ({
  ...jest.requireActual('mapbox-gl'),
  Map: jest.fn(),
  Popup: jest.fn(),
  Marker: jest.fn(),
}));


mapboxgl.Map.prototype = createMapMock();
mapboxgl.Popup.prototype = createMockPopup();

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

global.IntersectionObserver = class IntersectionObserver {
  disconnect = jest.fn();
  observe = jest.fn();
  takeRecords = jest.fn();
  unobserve = jest.fn();
};
