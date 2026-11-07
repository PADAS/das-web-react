// A small v2 schema shared by the draft tool tests.
export const SIGHTING_TYPE = {
  display: 'Wildlife sighting',
  geometry_type: 'Point',
  id: '7d1b0a4e-6f3c-4c55-9a7e-2f1c3b4d5e6f',
  value: 'wildlife_sighting',
  version: 2,
};

export const V1_TYPE = { display: 'Snare', id: '0b8e6f2a-3c4d-4e5f-8a9b-1c2d3e4f5a6b', value: 'snare_rep', version: 1 };

export const SIGHTING_SCHEMA = {
  json: {
    properties: {
      count: { minimum: 1, title: 'Count', type: 'number' },
      species: {
        anyOf: [{ enum: ['bear', 'wolf'], 'x-enumExtra': { bear: { display: 'Bear' }, wolf: { display: 'Wolf' } } }],
        title: 'Species',
        type: 'string',
      },
    },
    required: ['species'],
    type: 'object',
  },
  ui: {
    fields: { count: { parent: 'sighting', type: 'NUMERIC' }, species: { parent: 'sighting', type: 'CHOICE_LIST' } },
    headers: {},
    order: ['sighting'],
    sections: {
      sighting: {
        columns: 1,
        isActive: true,
        label: 'Sighting',
        leftColumn: [{ name: 'species', type: 'field' }, { name: 'count', type: 'field' }],
        rightColumn: [],
      },
    },
  },
};
