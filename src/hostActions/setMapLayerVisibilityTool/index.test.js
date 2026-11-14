import { mockStore } from '../../__test-helpers/MockStore';
import { setAnalyzerFeatureActiveStateForIDs } from '../../utils/analyzers';

import setMapLayerVisibilityTool from './';

jest.mock('../../utils/analyzers', () => ({
  ...jest.requireActual('../../utils/analyzers'),
  setAnalyzerFeatureActiveStateForIDs: jest.fn(),
}));

const analyzerFeatures = () => [{
  geojson: {
    features: [{ geometry: null, properties: { id: 'fence-line', pk: 'fence-line' }, type: 'Feature' }],
    type: 'FeatureCollection',
  },
  id: 'fence-analyzer',
  name: 'Fence',
}];

describe('hostActions - setMapLayerVisibilityTool', () => {
  let map, store;
  beforeEach(() => {
    map = {};
    store = mockStore({
      data: {
        analyzerFeatures: { data: analyzerFeatures() },
        featureSets: {
          data: [{
            id: 'boundaries',
            name: 'Boundaries',
            types: [{ feature_count: 2, feature_summaries: [{ id: 'park' }, { id: 'buffer' }], name: 'Area' }],
          }],
        },
        mapLayerFilter: { hiddenSubjectIDs: [] },
        subjectGroups: [{
          id: 'elephants',
          name: 'Elephants',
          subgroups: [{ id: 'herd-a', name: 'Herd A', subgroups: [], subjects: ['tembo'] }],
          subjects: ['kubwa'],
        }],
        subjectStore: { kubwa: { id: 'kubwa' }, ranger: { id: 'ranger' }, tembo: { id: 'tembo' } },
      },
    });
  });

  const runTool = (args) => setMapLayerVisibilityTool.run(
    args,
    { dispatch: store.dispatch, getState: store.getState, map }
  );

  test('hides a subject group with every nested subject, like its Map Layers checkbox', async () => {
    await runTool({ subject_group_ids: ['elephants'], subject_ids: ['ranger'], visible: false });

    expect(store.getActions()).toEqual([{ payload: ['ranger', 'kubwa', 'tembo'], type: 'HIDE_SUBJECTS' }]);
  });

  test('shows a feature set with every feature in it', async () => {
    await runTool({ feature_set_ids: ['boundaries'], visible: true });

    expect(store.getActions()).toEqual([{ payload: ['park', 'buffer'], type: 'SHOW_FEATURES' }]);
  });

  test('clears a hidden analyzer\'s selection on the map, like the Analyzers tab', async () => {
    await runTool({ analyzer_ids: ['fence-analyzer'], visible: false });

    expect(setAnalyzerFeatureActiveStateForIDs).toHaveBeenCalledWith(map, ['fence-line'], false);
    expect(store.getActions()).toEqual([{ payload: ['fence-analyzer'], type: 'HIDE_ANALYZERS' }]);
  });

  test('applies the visibility to the events on the map when asked', async () => {
    await runTool({ events_layer: true, visible: false });

    expect(store.getActions()).toEqual([{ payload: false, type: 'DISPLAY_REPORTS_ON_MAP' }]);
  });

  test('returns the ids it did not find instead of failing', async () => {
    const result = await runTool({ feature_ids: ['park', 'river'], subject_ids: ['ghost'], visible: false });

    expect(result.not_found).toEqual({
      analyzer_ids: [],
      feature_ids: ['river'],
      feature_set_ids: [],
      subject_group_ids: [],
      subject_ids: ['ghost'],
    });
    expect(result.updated).toEqual({ analyzers: 0, events_layer: false, features: 1, subjects: 0 });
  });
});
