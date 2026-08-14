import normalizeChoiceListValues from '.';

describe('Utils - form-schemas - normalizeChoiceListValues', () => {
  const v2MultipleChoiceListSchema = {
    properties: {
      team_members: {
        items: {
          anyOf: [{
            enum: ['kumoi_njapit', 'sam_kumum'],
            'x-enumExtra': {
              kumoi_njapit: { display: 'Kumoi Njapit' },
              sam_kumum: { display: 'Sam Kumum' },
            },
          }],
        },
        type: 'array',
      },
    },
    type: 'object',
  };
  const v2SingleChoiceListSchema = {
    properties: {
      maintenance_action: {
        anyOf: [{
          enum: ['colocaciondecamara', 'retirodecamara'],
          'x-enumExtra': {
            colocaciondecamara: { display: 'Colocacion de camara' },
            retirodecamara: { display: 'Retiro de camara' },
          },
        }],
      },
    },
    type: 'object',
  };
  const v2ChoiceListsSchema = {
    properties: { ...v2MultipleChoiceListSchema.properties, ...v2SingleChoiceListSchema.properties },
    type: 'object',
  };
  const v1ChoiceListsSchema = {
    properties: {
      maintenance_action: {
        enum: ['colocaciondecamara', 'retirodecamara'],
        enum_ext: [
          { title: 'Colocacion de camara', value: 'colocaciondecamara' },
          { title: 'Retiro de camara', value: 'retirodecamara' },
        ],
        type: 'object',
      },
      reported_by: {
        enum: [{ id: '1234', name: 'Canek' }],
        enum_ext: [{ title: 'Canek', value: { id: '1234', name: 'Canek' } }],
        type: 'object',
      },
      team_members: {
        items: {
          enum: ['kumoi_njapit', 'sam_kumum'],
          enum_ext: [{ title: 'Kumoi Njapit', value: 'kumoi_njapit' }, { title: 'Sam Kumum', value: 'sam_kumum' }],
          type: 'string',
        },
        type: 'array',
      },
    },
    type: 'object',
  };

  it('replaces a legacy choice object with its value in a multiple choice list', () => {
    const formData = {
      team_members: [
        { name: 'Kumoi Njapit', value: 'kumoi_njapit' },
        { name: 'Sam Kumum', value: 'sam_kumum' },
      ],
    };

    expect(normalizeChoiceListValues(formData, v2MultipleChoiceListSchema))
      .toEqual({ team_members: ['kumoi_njapit', 'sam_kumum'] });
  });

  it('replaces a legacy choice object with its value in a single choice list', () => {
    const formData = { maintenance_action: { name: 'Colocacion de camara', value: 'colocaciondecamara' } };

    expect(normalizeChoiceListValues(formData, v2SingleChoiceListSchema))
      .toEqual({ maintenance_action: 'colocaciondecamara' });
  });

  it('replaces a legacy choice object whose value is not a string', () => {
    expect(normalizeChoiceListValues({ maintenance_action: { name: 'Colocacion de camara', value: 1 } }, v2SingleChoiceListSchema))
      .toEqual({ maintenance_action: 1 });

    expect(normalizeChoiceListValues({ team_members: { name: 'Kumoi Njapit', value: 1 } }, v2MultipleChoiceListSchema))
      .toEqual({ team_members: [1] });
  });

  it('unwraps a single choice list value stored as a one item array of legacy choice objects', () => {
    const formData = { maintenance_action: [{ name: 'Colocacion de camara', value: 'colocaciondecamara' }] };

    expect(normalizeChoiceListValues(formData, v2SingleChoiceListSchema))
      .toEqual({ maintenance_action: 'colocaciondecamara' });
  });

  it('wraps a multiple choice list value stored as a single legacy choice object', () => {
    const formData = { team_members: { name: 'Kumoi Njapit', value: 'kumoi_njapit' } };

    expect(normalizeChoiceListValues(formData, v2MultipleChoiceListSchema))
      .toEqual({ team_members: ['kumoi_njapit'] });
  });

  it('wraps a multiple choice list value stored as a bare string', () => {
    const formData = { team_members: 'kumoi_njapit' };

    expect(normalizeChoiceListValues(formData, v2MultipleChoiceListSchema))
      .toEqual({ team_members: ['kumoi_njapit'] });
  });

  it('unwraps a single choice list value stored as a one item array of strings', () => {
    const formData = { maintenance_action: ['colocaciondecamara'] };

    expect(normalizeChoiceListValues(formData, v2SingleChoiceListSchema))
      .toEqual({ maintenance_action: 'colocaciondecamara' });
  });

  it('keeps the first choice of a single choice list value stored as a multiple item array', () => {
    const formData = {
      maintenance_action: [
        { name: 'Colocacion de camara', value: 'colocaciondecamara' },
        { name: 'Retiro de camara', value: 'retirodecamara' },
      ],
    };

    expect(normalizeChoiceListValues(formData, v2SingleChoiceListSchema))
      .toEqual({ maintenance_action: 'colocaciondecamara' });
  });

  it('replaces legacy choice objects in v1 choice lists', () => {
    const formData = {
      maintenance_action: { name: 'Colocacion de camara', value: 'colocaciondecamara' },
      team_members: [{ name: 'Kumoi Njapit', value: 'kumoi_njapit' }],
    };

    expect(normalizeChoiceListValues(formData, v1ChoiceListsSchema))
      .toEqual({ maintenance_action: 'colocaciondecamara', team_members: ['kumoi_njapit'] });
  });

  it('keeps every choice of a v1 choice list value stored as an array', () => {
    const formData = {
      maintenance_action: [
        { name: 'Colocacion de camara', value: 'colocaciondecamara' },
        { name: 'Retiro de camara', value: 'retirodecamara' },
      ],
    };

    expect(normalizeChoiceListValues(formData, v1ChoiceListsSchema))
      .toEqual({ maintenance_action: ['colocaciondecamara', 'retirodecamara'] });
  });

  it('leaves the value of a v1 field whose choices are objects alone', () => {
    const formData = { reported_by: { id: '1234', name: 'Canek', value: '1234' } };

    expect(normalizeChoiceListValues(formData, v1ChoiceListsSchema)).toBe(formData);
  });

  it('normalizes a choice list declared in the subschema of a conditional section', () => {
    const schema = {
      allOf: [{
        if: { allOf: [] },
        then: { properties: v2MultipleChoiceListSchema.properties, required: [] },
        'x-section': 'section-1',
      }],
      properties: {},
      type: 'object',
    };
    const formData = { team_members: [{ name: 'Kumoi Njapit', value: 'kumoi_njapit' }] };

    expect(normalizeChoiceListValues(formData, schema)).toEqual({ team_members: ['kumoi_njapit'] });
  });

  it('normalizes the choice lists of every collection item', () => {
    const schema = {
      properties: {
        sightings: {
          items: {
            properties: v2MultipleChoiceListSchema.properties,
            type: 'object',
          },
          type: 'array',
        },
      },
      type: 'object',
    };
    const formData = {
      sightings: [
        { team_members: [{ name: 'Kumoi Njapit', value: 'kumoi_njapit' }] },
        { team_members: ['sam_kumum'] },
      ],
    };

    expect(normalizeChoiceListValues(formData, schema))
      .toEqual({ sightings: [{ team_members: ['kumoi_njapit'] }, { team_members: ['sam_kumum'] }] });
  });

  it('leaves values of other field types alone', () => {
    const schema = {
      properties: {
        location: { properties: { latitude: { type: 'number' }, longitude: { type: 'number' } }, type: 'object' },
        number_of_snares_found: { type: 'number' },
        reported_at: { format: 'date-time', type: 'string' },
      },
      type: 'object',
    };
    const formData = {
      location: { latitude: 1, longitude: 2 },
      number_of_snares_found: 3,
      reported_at: '2026-05-12T00:00:00Z',
    };

    expect(normalizeChoiceListValues(formData, schema)).toBe(formData);
  });

  it('returns the same form data reference when there is nothing to repair', () => {
    const formData = { team_members: ['kumoi_njapit'] };

    expect(normalizeChoiceListValues(formData, v2MultipleChoiceListSchema)).toBe(formData);
  });

  it('returns the given form data when there is no schema to normalize against', () => {
    const formData = { team_members: [{ name: 'Kumoi Njapit', value: 'kumoi_njapit' }] };

    expect(normalizeChoiceListValues(formData, null)).toBe(formData);
    expect(normalizeChoiceListValues(formData, {})).toBe(formData);
  });

  it('handles empty and missing form data', () => {
    expect(normalizeChoiceListValues({}, v2MultipleChoiceListSchema)).toEqual({});
    expect(normalizeChoiceListValues(undefined, v2MultipleChoiceListSchema)).toBeUndefined();
    expect(normalizeChoiceListValues(null, v2MultipleChoiceListSchema)).toBeNull();
  });

  it('keeps a cleared choice list value cleared', () => {
    const formData = { maintenance_action: '', team_members: [] };

    expect(normalizeChoiceListValues(formData, v2ChoiceListsSchema)).toEqual({ maintenance_action: '', team_members: [] });
  });

  it('clears a choice list value stored in the shape of the other kind of choice list', () => {
    const formData = { maintenance_action: [], team_members: '' };

    expect(normalizeChoiceListValues(formData, v2ChoiceListsSchema))
      .toEqual({ maintenance_action: undefined, team_members: [] });
  });
});
