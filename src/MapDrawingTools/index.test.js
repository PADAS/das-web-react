import React from 'react';
import { render } from '@testing-library/react';
import { createMapMock } from '../__test-helpers/mocks';

import { MapContext } from '../App';




import MapDrawingTools, { DRAWING_MODES } from './';

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
  let points = [];
  let drawing = false;
  let map;

  beforeEach(() => {
    map = createMapMock();
  });

  fit('not rendering if no point data is provided', () => {
    const { asFragment } = render(
      <MapContext.Provider value={map}>
        <MapDrawingTools drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} />
      </MapContext.Provider>
    );

    console.log('the fragment', asFragment());
  });

  test('rendering when point data is received', () => {

  });

  test('firing #onChange when the map is clicked', () => {

  });

  test('only firing #onChange once on double click', () => {

  });

  test('firing #onClickPoint when a drawn point is clicked', () => {

  });

  test('firing #onClickLine when a drawn line is clicked', () => {

  });

  test('firing #onClickFill when a drawn polyon\'s fill is clicked', () => {

  });

  test('firing #onClickLabel when a drawn line\'s label is clicked', () => {

  });

  test('drawing a polygon when the draw mode is for polygons', () => {

  });

  test('drawing a line when the draw mode is for lines', () => {

  });
});
