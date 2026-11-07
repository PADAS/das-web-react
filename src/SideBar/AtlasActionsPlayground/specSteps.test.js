import { buildSteps, narrowOptions, toArguments } from './specSteps';

const SCHEMA = {
  properties: {
    feature_ids: { items: { type: 'string' }, type: 'array', 'x-source': 'features', 'x-within': 'feature_set_ids' },
    feature_set_ids: { items: { type: 'string' }, type: 'array', 'x-source': 'feature_sets' },
    reset: { type: 'boolean' },
    visible: { type: 'boolean' },
  },
  required: ['visible'],
  type: 'object',
};

describe('AtlasActionsPlayground - specSteps', () => {
  test('puts a narrowed list after the list that narrows it', () => {
    expect(buildSteps(SCHEMA)).toEqual([
      { kind: 'source', names: ['feature_set_ids'] },
      { kind: 'source', names: ['feature_ids'] },
      { kind: 'options', names: ['reset', 'visible'] },
      { kind: 'review', names: [] },
    ]);
  });

  test('leaves out unpicked values but keeps required ones', () => {
    expect(toArguments(SCHEMA, { feature_ids: [], reset: false, visible: false })).toEqual({ visible: false });
  });

  test('narrows options to the picked parents, or keeps all with none picked', () => {
    const options = [{ id: 'a', parents: { feature_sets: ['s1'] } }, { id: 'b', parents: { feature_sets: ['s2'] } }];

    expect(narrowOptions(options, 'feature_sets', ['s2'])).toEqual([options[1]]);
    expect(narrowOptions(options, 'feature_sets', [])).toEqual(options);
  });
});
