import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { createMapMock } from '../__test-helpers/mocks';

import { MapContext } from '../App';
import MapDrawingTools, { DRAWING_MODES } from './';

import { LAYER_IDS } from './MapLayers';


describe('rendering', () => {
  test('rendering without crashing', () => {
    let points = [];
    let drawing = false;
    let map = createMapMock();

    render(
      <MapContext.Provider value={map}>
        <MapDrawingTools drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
      </MapContext.Provider>
    );
  });
});

describe('MapDrawingTools', () => {
  let points, drawing, map;

  beforeEach(() => {
    map = createMapMock();
    drawing = true;
  });

  describe('with no point data', () => {
    test('not rendering if no point data is provided', () => {
      points = [];
      drawing = true;

      render(
        <MapContext.Provider value={map}>
          <MapDrawingTools drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
        </MapContext.Provider>
      );
    });
  });

  describe('with point data', () => {
    beforeEach(() => {
      points = [[1, 2], [2, 3], [3, 4], [1, 2]];
    });

    fit('creating map layers and sources', async () => {
      render(
        <MapContext.Provider value={map}>
          <MapDrawingTools drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
        </MapContext.Provider>
      );

      await waitFor(() => {
        expect(map.addSource).toHaveBeenCalled();
        expect(map.addLayer).toHaveBeenCalled();
      });
    });

    test('firing #onChange when the map is clicked', () => {
      const onChange = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingTools onChange={onChange} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', { lngLat: { lat: [2, 3], lng: [3, 4] } });

      expect(onChange).toHaveBeenCalled();
    });

    test('only firing #onChange once on double click', () => {
      const onChange = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingTools onChange={onChange} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('dblclick', { lngLat: { lat: [2, 3], lng: [3, 4] } });

      expect(onChange).toHaveBeenCalledTimes(1);

    });

    test('firing #onClickPoint when a drawn point is clicked', () => {
      const onClickPoint = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingTools onClickPoint={onClickPoint} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', LAYER_IDS.POINTS, { lngLat: { lat: [2, 3], lng: [3, 4] } });

      expect(onClickPoint).toHaveBeenCalled();
    });

    test('firing #onClickLine when a drawn line is clicked', () => {
      const onClickLine = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingTools onClickLine={onClickLine} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', LAYER_IDS.LINES, { lngLat: { lat: [2, 3], lng: [3, 4] } });

      expect(onClickLine).toHaveBeenCalled();
    });

    test('firing #onClickFill when a drawn polyon\'s fill is clicked', () => {
      const onClickFill = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingTools onClickFill={onClickFill} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', LAYER_IDS.FILL, { lngLat: { lat: [2, 3], lng: [3, 4] } });

      expect(onClickFill).toHaveBeenCalled();
    });

    test('firing #onClickLabel when a drawn line\'s label is clicked', () => {
      const onClickLabel = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingTools onClickLabel={onClickLabel} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', LAYER_IDS.LABELS, { lngLat: { lat: [2, 3], lng: [3, 4] } });

      expect(onClickLabel).toHaveBeenCalled();
    });

    test('drawing a polygon when the draw mode is for polygons', () => {
      const onChange = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingTools onChange={onChange} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', { lngLat: { lat: [2, 3], lng: [3, 4] } });

      expect(onChange).toHaveBeenCalledTimes(1);
      console.log('the geojson', onChange.mock.calls[0][1]);
    });

    test('drawing a line when the draw mode is for lines', () => {
      const onChange = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingTools onChange={onChange} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', { lngLat: { lat: [2, 3], lng: [3, 4] } });

      expect(onChange).toHaveBeenCalledTimes(1);
      console.log('the geojson', onChange.mock.calls[0][1]);
    });
  });

  describe('the cursor popup', () => {
    test('rendering a cursor popup with point details when drawing and the mouse is moved', async () => {
      render(
        <MapContext.Provider value={map}>
          <MapDrawingTools drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
        </MapContext.Provider>
      );

      const popup = screen.findByTestId('drawing-tools-popup');

      expect(popup).toHaveTextContent('Bearing');
      expect(popup).toHaveTextContent('Distance');
      expect(popup).toHaveTextContent('Click to add a point');
    });
  });
});
