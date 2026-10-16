import { Provider } from 'react-redux';

import { createMapMock } from '../__test-helpers/mocks';
import { LAYER_IDS } from '../constants';
import { MapContext } from '../MapContext';
import { mockStore } from '../__test-helpers/MockStore';
import { render } from '../test-utils';

import AnalyzersLayer from './';

const EMPTY_FEATURE_COLLECTION = { features: [], type: 'FeatureCollection' };

describe('AnalyzersLayer', () => {
  let map, props, store;
  beforeEach(() => {
    map = createMapMock();
    props = {
      criticalLines: EMPTY_FEATURE_COLLECTION,
      criticalPolys: EMPTY_FEATURE_COLLECTION,
      isSubjectSymbolsLayerReady: true,
      layerGroups: [{ feature_ids: ['warning-line', 'critical-line'] }, { feature_ids: ['other-line'] }],
      onAnalyzerFeatureClick: jest.fn(),
      onAnalyzerGroupEnter: jest.fn(),
      onAnalyzerGroupExit: jest.fn(),
      warningLines: EMPTY_FEATURE_COLLECTION,
      warningPolys: EMPTY_FEATURE_COLLECTION,
    };
    store = mockStore({ view: { showMapNames: {}, simplifyMapDataOnZoom: { enabled: false } } });
  });

  const renderAnalyzersLayer = (overrideProps) => <Provider store={store}>
    <MapContext.Provider value={map}>
      <AnalyzersLayer {...props} {...overrideProps} />
    </MapContext.Provider>
  </Provider>;

  const hoverWarningLine = () => {
    map.__test__.fireHandlers('mouseenter', LAYER_IDS.ANALYZER_LINES_WARNING, {
      features: [{ properties: { id: 'warning-line' } }],
    });
  };

  test('does not rebind its map handlers when the parent passes new handlers', () => {
    const { rerender } = render(renderAnalyzersLayer());
    const bindingsCount = map.on.mock.calls.length;

    rerender(renderAnalyzersLayer({ onAnalyzerFeatureClick: jest.fn(), onAnalyzerGroupEnter: jest.fn() }));

    expect(map.on).toHaveBeenCalledTimes(bindingsCount);
    expect(map.off).not.toHaveBeenCalled();
  });

  test('calls the latest handlers with the hovered analyzer group', () => {
    const onAnalyzerGroupEnter = jest.fn();
    const onAnalyzerGroupExit = jest.fn();
    const { rerender } = render(renderAnalyzersLayer());

    rerender(renderAnalyzersLayer({ onAnalyzerGroupEnter, onAnalyzerGroupExit }));
    hoverWarningLine();
    map.__test__.fireHandlers('mouseleave', LAYER_IDS.ANALYZER_LINES_WARNING, {});

    expect(onAnalyzerGroupEnter).toHaveBeenCalledWith(expect.any(Object), ['warning-line', 'critical-line']);
    expect(onAnalyzerGroupExit).toHaveBeenCalledWith(expect.any(Object), ['warning-line', 'critical-line']);
    expect(props.onAnalyzerGroupEnter).not.toHaveBeenCalled();
  });

  test('calls the latest click handler when the user clicks an analyzer', () => {
    const onAnalyzerFeatureClick = jest.fn();
    const { rerender } = render(renderAnalyzersLayer());

    rerender(renderAnalyzersLayer({ onAnalyzerFeatureClick }));
    map.__test__.fireHandlers('click', LAYER_IDS.ANALYZER_POLYS_CRITICAL, {});

    expect(onAnalyzerFeatureClick).toHaveBeenCalledTimes(1);
    expect(props.onAnalyzerFeatureClick).not.toHaveBeenCalled();
  });
});
