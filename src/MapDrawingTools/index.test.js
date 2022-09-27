import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { createMapMock } from '../__test-helpers/mocks';

import { MapContext } from '../App';
import MapDrawingTools, { DRAWING_MODES } from './';
import MapDrawingToolsContextProvider, { MapDrawingToolsContext } from './ContextProvider';

import { LAYER_IDS } from './MapLayers';

describe('rendering', () => {
  test('rendering without crashing', () => {
    let points = [];
    let drawing = false;
    let map = createMapMock();

    render(
      <MapContext.Provider value={map}>
        <MapDrawingToolsContextProvider>
          <MapDrawingToolsContextProvider>
          </MapDrawingToolsContextProvider>
          <MapDrawingTools drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
        </MapDrawingToolsContextProvider>
      </MapContext.Provider>
    );
  });
});

describe('MapDrawingTools', () => {
  let points, drawing, map;

  beforeEach(() => {
    map = createMapMock();
    drawing = true;

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('with no point data', () => {
    test('not rendering if no point data is provided', () => {
      points = [];
      drawing = true;

      render(
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <MapDrawingTools drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      );
    });
  });

  describe('with point data', () => {
    beforeEach(() => {
      points = [[1, 2], [2, 3], [3, 4]];
    });

    test('adding a source for the draw data', () => {
      map.getSource.mockReturnValue(null);

      render(
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <MapDrawingTools drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      );

      expect(map.addSource).toHaveBeenCalled();
      expect(map.addLayer).not.toHaveBeenCalled();
    });

    test('adding a layer if the source exists', () => {
      map.getSource.mockReturnValue({ whatever: 'yes' });

      render(
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <MapDrawingTools drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      );

      expect(map.addSource).not.toHaveBeenCalled();
      expect(map.addLayer).toHaveBeenCalled();
    });

    test('firing #onChange when the map is clicked', async () => {
      const onChange = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <MapDrawingTools onChange={onChange} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', { lngLat: { lat: [2, 3], lng: [3, 4] } });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    test('firing #onClickPoint when a drawn point is clicked', async () => {
      const onClickPoint = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <MapDrawingTools onClickPoint={onClickPoint} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', LAYER_IDS.POINTS, { lngLat: { lat: [2, 3], lng: [3, 4] } });

      await waitFor(() => {
        expect(onClickPoint).toHaveBeenCalled();
      });
    });

    test('firing #onClickLine when a drawn line is clicked', async () => {
      const onClickLine = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <MapDrawingTools onClickLine={onClickLine} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', LAYER_IDS.LINES, { lngLat: { lat: [2, 3], lng: [3, 4] } });

      await waitFor(() => {
        expect(onClickLine).toHaveBeenCalled();
      });
    });

    test('firing #onClickFill when a drawn polyon\'s fill is clicked', async () => {
      const onClickFill = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <MapDrawingTools onClickFill={onClickFill} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', LAYER_IDS.FILL, { lngLat: { lat: [2, 3], lng: [3, 4] } });

      await waitFor(() => {
        expect(onClickFill).toHaveBeenCalled();
      });
    });

    test('firing #onClickLabel when a drawn line\'s label is clicked', async () => {
      const onClickLabel = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <MapDrawingTools onClickLabel={onClickLabel} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', LAYER_IDS.LINE_LABELS, { lngLat: { lat: [2, 3], lng: [3, 4] } });

      await waitFor(() => {
        expect(onClickLabel).toHaveBeenCalled();
      });
    });

    test('drawing a polygon when the draw mode is for polygons', async () => {
      const setMapDrawingData = jest.fn(), onChange = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingToolsContext.Provider value={{ setMapDrawingData  }}>
            <MapDrawingTools onChange={onChange} drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
          </MapDrawingToolsContext.Provider>
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', { lngLat: { lat: [2, 3], lng: [3, 4] } });

      await waitFor(() => {
        expect(setMapDrawingData).toHaveBeenCalled();
        expect(onChange).toHaveBeenCalled();

        const callbackData = setMapDrawingData.mock.calls[0][0];

        expect(callbackData.drawnLinePoints.type).toBe('FeatureCollection');
        expect(callbackData.drawnLinePoints.features.filter((feature) => feature.properties.midpoint)).toHaveLength(0);
        expect(callbackData.drawnLinePoints.features.filter((feature) => !feature.properties.midpoint)).toHaveLength(6);
        expect(callbackData.drawnLineSegments.type).toBe('FeatureCollection');
        expect(callbackData.drawnLineSegments.features).toHaveLength(3);
        expect(callbackData.fillPolygon.geometry.type).toBe('Polygon');
      });
    });

    test('drawing a line when the draw mode is for lines', async () => {
      const setMapDrawingData = jest.fn(), onChange = jest.fn();

      render(
        <MapContext.Provider value={map}>
          <MapDrawingToolsContext.Provider value={{ setMapDrawingData  }}>
            <MapDrawingTools onChange={onChange} drawing={drawing} drawingMode={DRAWING_MODES.LINE} points={points} />
          </MapDrawingToolsContext.Provider>
        </MapContext.Provider>
      );

      map.__test__.fireHandlers('click', { lngLat: { lat: [2, 3], lng: [3, 4] } });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        expect(setMapDrawingData).toHaveBeenCalled();

        const callbackData = setMapDrawingData.mock.calls[0][0];

        expect(callbackData.fillPolygon.type).toBe('FeatureCollection');
        expect(callbackData.fillPolygon.features).toHaveLength(0);
        expect(callbackData.drawnLinePoints.type).toBe('FeatureCollection');
        expect(callbackData.drawnLinePoints.features.filter((feature) => feature.properties.midpoint)).toHaveLength(0);
        expect(callbackData.drawnLinePoints.features.filter((feature) => !feature.properties.midpoint)).toHaveLength(6);
        expect(callbackData.drawnLineSegments.type).toBe('FeatureCollection');
        expect(callbackData.drawnLineSegments.features).toHaveLength(3);
      });
    });
  });

  describe('the cursor popup', () => {
    test('rendering a cursor popup with point details when drawing and the mouse is moved', async () => {
      const points = [[1, 2], [2, 3], [4, 5]];

      const { container } = render(
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <MapDrawingTools drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      );

      await waitFor(() => {
        expect(container).toHaveTextContent('Bearing');
        expect(container).toHaveTextContent('Total length');
      });

    });

    test('renders a popup when given a popup render function', async () => {
      const points = [[1, 2], [2, 3], [4, 5]];

      const { container } = render(
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <MapDrawingTools
              drawing={drawing}
              drawingMode={DRAWING_MODES.POLYGON}
              points={points}
              renderCursorPopup={() => <div>Cursor popup rendering stuff</div>}
            />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      );

      await waitFor(() => {
        expect(container).toHaveTextContent('Cursor popup rendering stuff');
      });
    });
  });
});
