import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../../../__test-helpers/mocks';
import { fetchAnalyzers } from '../../../ducks/analyzers';
import { MapContext } from '../../../MapContext';
import { mockStore } from '../../../__test-helpers/MockStore';
import { render, screen } from '../../../test-utils';

import AnalyzersTab from './';

jest.mock('../../../ducks/analyzers', () => ({
  ...jest.requireActual('../../../ducks/analyzers'),
  fetchAnalyzers: jest.fn(),
}));

const analyzerFixture = (id, name) => ({
  geojson: {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] },
      properties: { analyzer_type: 'geofence', pk: `${id}-feature`, title: name },
    }],
  },
  id,
  name,
  type: 'geofence',
});

describe('SideBar - MapLayersTab - AnalyzersTab', () => {
  let map;

  const renderAnalyzersTab = ({ analyzers = [], hasFailures = false } = {}) => render(
    <Provider store={mockStore({
      data: {
        analyzerFeatures: { data: analyzers, hasFailures },
        mapLayerFilter: { hiddenAnalyzerIDs: [], text: '' },
      },
      view: {},
    })}>
      <MapContext.Provider value={map}>
        <AnalyzersTab />
      </MapContext.Provider>
    </Provider>
  );

  beforeEach(() => {
    map = createMapMock();
    fetchAnalyzers.mockImplementation(() => () => {});
  });

  test('does not show an error when the analyzers loaded', () => {
    renderAnalyzersTab({ analyzers: [analyzerFixture('a', 'Alpha')] });

    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('tells the user when no analyzers could be loaded', () => {
    renderAnalyzersTab({ hasFailures: true });

    expect(screen.getByRole('alert')).toHaveTextContent('Analyzers could not be loaded.');
  });

  test('tells the user when only some analyzers could be loaded', () => {
    renderAnalyzersTab({ analyzers: [analyzerFixture('a', 'Alpha')], hasFailures: true });

    expect(screen.getByRole('alert')).toHaveTextContent('Some analyzers could not be loaded.');
  });

  test('still lists the analyzers that did load alongside the error', () => {
    renderAnalyzersTab({ analyzers: [analyzerFixture('a', 'Alpha')], hasFailures: true });

    expect(screen.getByText('Alpha')).toBeVisible();
  });

  test('refetches the analyzers when the user retries', async () => {
    renderAnalyzersTab({ hasFailures: true });

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(fetchAnalyzers).toHaveBeenCalled();
  });
});
