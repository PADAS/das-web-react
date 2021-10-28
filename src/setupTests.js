import ReactGA from 'react-ga';
import 'jest-webgl-canvas-mock';
import '@testing-library/jest-dom/extend-expect';

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
