import React, { useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { render } from '@testing-library/react';

import { createMapMock } from '../__test-helpers/mocks';

import Popup from './';
import { MapContext } from '../App';

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
  test('rendering without crashing', () => {
    renderWithWrapper(<Popup />);
  });

  test('setting rendered React components as DOM content', () => {
    expect(mapboxgl.Popup.prototype.setDOMContent).not.toHaveBeenCalled();

    renderWithWrapper(
      <Popup>
        <MockChildComponenet />
      </Popup>
    );

    expect(mapboxgl.Popup.prototype.setDOMContent).toHaveBeenCalled();
    const domContent = mapboxgl.Popup.prototype.setDOMContent.mock.calls[0][0];

    expect(domContent instanceof HTMLElement).toBe(true);
    expect(domContent).toHaveTextContent(testString);
  });

  test('setting and updating the offset', () => {
    let offset = [0, 0];

    const { rerender } = renderWithWrapper(
      <Popup offset={offset} />
    );

    expect(mapboxgl.Popup).toHaveBeenCalledWith(expect.objectContaining(
      {
        offset: [0, 0]
      }
    ));

    offset = [-1, -2];

    rerender(<Popup offset={offset} />);

    expect(mapboxgl.Popup.prototype.setOffset).toHaveBeenCalledWith([-1, -2]);
  });

  test('setting and updating the coordinates', () => {
    let coordinates = [0, 0];

    const { rerender } = renderWithWrapper(
      <Popup coordinates={coordinates} />
    );

    expect(mapboxgl.Popup.prototype.setLngLat).toHaveBeenCalledWith([0, 0]);

    coordinates = [-1, -2];

    rerender(<Popup coordinates={coordinates} />);

    expect(mapboxgl.Popup.prototype.setLngLat).toHaveBeenCalledWith([-1, -2]);
  });

  test('setting the anchor', () => {
    let anchor = 'bottom';

    renderWithWrapper(
      <Popup anchor={anchor} />
    );

    expect(mapboxgl.Popup).toHaveBeenCalledWith(expect.objectContaining(
      {
        anchor: 'bottom'
      }
    ));

  });

  test('setting and removing classes', () => {
    let className = 'very classy wow';

    const { rerender } = renderWithWrapper(<Popup className={className} />);
    expect(mapboxgl.Popup.prototype.toggleClass).toHaveBeenCalledTimes(3);
    expect(mapboxgl.Popup.prototype.toggleClass).toHaveBeenCalledWith('very');
    expect(mapboxgl.Popup.prototype.toggleClass).toHaveBeenCalledWith('classy');
    expect(mapboxgl.Popup.prototype.toggleClass).toHaveBeenCalledWith('wow');

    className = 'very neat wow';
    mapboxgl.Popup.prototype.toggleClass.mockClear();

    rerender(<Popup className={className} />);
    expect(mapboxgl.Popup.prototype.toggleClass).toHaveBeenCalledTimes(2);
    expect(mapboxgl.Popup.prototype.toggleClass).toHaveBeenCalledWith('classy');
    expect(mapboxgl.Popup.prototype.toggleClass).toHaveBeenCalledWith('neat');
  });

  test('teardown', () => {
    const { unmount } = renderWithWrapper(<Popup />);
    expect(mapboxgl.Popup.prototype.remove).not.toHaveBeenCalled();

    unmount();
    expect(mapboxgl.Popup.prototype.remove).toHaveBeenCalled();
  });

});