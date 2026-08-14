import normalizeChoiceListValues from './';

describe('normalizeChoiceListValues', () => {
  it('replaces a legacy choice object with its value', () => {
    expect(normalizeChoiceListValues({ maintenance_action: { name: 'Colocacion de camara', value: 'colocaciondecamara' } }))
      .toEqual({ maintenance_action: 'colocaciondecamara' });
  });

  it('replaces the legacy choice objects of a multiple choice list', () => {
    const formData = {
      team_members: [
        { name: 'Kumoi Njapit', value: 'kumoi_njapit' },
        { name: 'Sam Kumum', value: 'sam_kumum' },
      ],
    };

    expect(normalizeChoiceListValues(formData)).toEqual({ team_members: ['kumoi_njapit', 'sam_kumum'] });
  });

  it('replaces legacy choice objects holding non string values', () => {
    expect(normalizeChoiceListValues({ count: { name: 'Two', value: 2 }, seen: { name: 'Yes', value: true } }))
      .toEqual({ count: 2, seen: true });
  });

  it('replaces legacy choice objects nested in collection items', () => {
    const formData = {
      sightings: [
        { species: { name: 'Elephant', value: 'elephant' }, count: 3 },
        { species: { name: 'Zebra', value: 'zebra' }, count: 1 },
      ],
    };

    expect(normalizeChoiceListValues(formData)).toEqual({
      sightings: [{ species: 'elephant', count: 3 }, { species: 'zebra', count: 1 }],
    });
  });

  it('leaves already normalized values untouched', () => {
    const formData = { maintenance_action: 'colocaciondecamara', team_members: ['kumoi_njapit'] };

    expect(normalizeChoiceListValues(formData)).toEqual(formData);
  });

  it('leaves the option maps that section conditions use untouched', () => {
    const formData = { maintenance_action: { colocaciondecamara: true } };

    expect(normalizeChoiceListValues(formData)).toEqual(formData);
  });

  it('leaves objects that are not legacy choices untouched', () => {
    const formData = {
      reported_by: { id: '1234', name: 'Canek', value: '1234' },
      measurement: { name: 'Length', value: { unit: 'm', amount: 3 } },
      note: { value: 'No name key here' },
    };

    expect(normalizeChoiceListValues(formData)).toEqual(formData);
  });

  it('keeps cleared and empty values as they are', () => {
    const formData = { maintenance_action: '', team_members: [], comment: null, count: undefined };

    expect(normalizeChoiceListValues(formData)).toEqual(formData);
  });

  it('returns non object form data as it is', () => {
    expect(normalizeChoiceListValues(undefined)).toBeUndefined();
    expect(normalizeChoiceListValues(null)).toBeNull();
    expect(normalizeChoiceListValues('kumoi_njapit')).toBe('kumoi_njapit');
  });

  it('preserves the reference of form data that needs no changes', () => {
    const formData = { team_members: ['kumoi_njapit'], sightings: [{ species: 'elephant' }] };

    const normalizedFormData = normalizeChoiceListValues(formData);

    expect(normalizedFormData).toBe(formData);
    expect(normalizedFormData.team_members).toBe(formData.team_members);
    expect(normalizedFormData.sightings).toBe(formData.sightings);
  });

  it('preserves the reference of the values that need no changes', () => {
    const formData = {
      team_members: ['kumoi_njapit'],
      maintenance_action: { name: 'Colocacion de camara', value: 'colocaciondecamara' },
    };

    expect(normalizeChoiceListValues(formData).team_members).toBe(formData.team_members);
  });
});
