import React, { useRef } from 'react';
import { cleanup, render } from '@testing-library/react';

import { createMapMock } from '../__test-helpers/mocks';

import Popup from './';
import { MapContext } from '../App';

const popupAnchor = [];
const popupClass = [];
const popupDomContent = [];
const popupLngLat = [];
const popupOffset = [];
let removed = false;

jest.mock('mapbox-gl', () => ({
  ...jest.requireActual('mapbox-gl'),
  Popup: class {
    constructor({ anchor, offset }) {
      popupAnchor.push(anchor);
      popupOffset.push(offset);
    }
    addTo() {}
    on() {}
    remove() { removed = true; }
    setDOMContent(domContent) { popupDomContent.push(domContent); }
    setLngLat(lngLat) { popupLngLat.push(lngLat); }
    setOffset() {}
    toggleClass(className) { popupClass.push(className); }
  },
}));

const Wrapper = ({ children }) => {
  const mapRef = useRef(createMapMock());

  return <MapContext.Provider value={mapRef.current}>
    {children}
  </MapContext.Provider>;
};

const testString = 'What a nice day to be a mock component!';
const MockChildComponenet = () =>
  <>
    {testString}
  </>;

const renderWithWrapper = (component, options) =>
  render(
    component,
    { wrapper: Wrapper, ...options },
  );

describe('the Popup component', () => {
  beforeEach(() => {
    removed = false;
  });

  test('rendering without crashing', () => {
    renderWithWrapper(<Popup />);
  });

  test('setting rendered React components as DOM content', () => {
    renderWithWrapper(
      <Popup>
        <MockChildComponenet />
      </Popup>
    );

    expect(popupDomContent[popupDomContent.length - 1] instanceof HTMLElement).toBe(true);
    expect(popupDomContent[popupDomContent.length - 1]).toHaveTextContent(testString);
  });

  test('setting and updating the offset', () => {
    let offset = [0, 0];
    renderWithWrapper(<Popup offset={offset} />);

    expect(popupOffset[popupOffset.length - 1]).toEqual([0, 0]);


    cleanup();

    offset = [-1, -2];
    renderWithWrapper(<Popup offset={offset} />);

    expect(popupOffset[popupOffset.length - 1]).toEqual([-1, -2]);
  });

  test('setting and updating the coordinates', () => {
    let coordinates = [0, 0];
    const { rerender } = renderWithWrapper(<Popup coordinates={coordinates} />);

    expect(popupLngLat[popupLngLat.length - 1]).toEqual([0, 0]);

    coordinates = [-1, -2];
    rerender(<Popup coordinates={coordinates} />);

    expect(popupLngLat[popupLngLat.length - 1]).toEqual([-1, -2]);
  });

  test('setting the anchor', () => {
    let anchor = 'bottom';

    renderWithWrapper(
      <Popup anchor={anchor} />
    );

    expect(popupAnchor[popupAnchor.length - 1]).toBe('bottom');
  });

  test('setting and removing classes', () => {
    let className = 'very classy wow';

    const { rerender } = renderWithWrapper(<Popup className={className} />);
    expect(popupClass[popupClass.length - 3]).toBe('very');
    expect(popupClass[popupClass.length - 2]).toBe('classy');
    expect(popupClass[popupClass.length - 1]).toBe('wow');

    className = 'very neat wow';
    rerender(<Popup className={className} />);

    expect(popupClass[popupClass.length - 2]).toBe('classy');
    expect(popupClass[popupClass.length - 1]).toBe('neat');
  });

  test('teardown', () => {
    const { unmount } = renderWithWrapper(<Popup />);

    expect(removed).toBe(false);

    unmount();

    expect(removed).toBe(true);
  });
});
