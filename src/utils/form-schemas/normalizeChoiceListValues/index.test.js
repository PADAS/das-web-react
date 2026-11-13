import { FORM_ELEMENT_TYPES } from '../constants';
import normalizeChoiceListValues from './';

describe('normalizeChoiceListValues', () => {
  const formElements = {
    maintenance_action: { type: FORM_ELEMENT_TYPES.CHOICE_LIST },
    team_members: { type: FORM_ELEMENT_TYPES.CHOICE_LIST },
    type_accident: { type: FORM_ELEMENT_TYPES.TEXT },
    sightings: { type: FORM_ELEMENT_TYPES.COLLECTION },
    'sightings.species': { type: FORM_ELEMENT_TYPES.CHOICE_LIST },
    'sightings.count': { type: FORM_ELEMENT_TYPES.NUMERIC },
    custom_attributes: { type: FORM_ELEMENT_TYPES.COLLECTION },
    'custom_attributes.name': { type: FORM_ELEMENT_TYPES.TEXT },
    'custom_attributes.value': { type: FORM_ELEMENT_TYPES.TEXT },
  };

  it('replaces a legacy choice object with its value', () => {
    const formData = { maintenance_action: { name: 'Colocacion de camara', value: 'colocaciondecamara' } };

    expect(normalizeChoiceListValues(formData, formElements)).toEqual({ maintenance_action: 'colocaciondecamara' });
  });

  it('replaces the legacy choice objects of a multiple choice list', () => {
    const formData = {
      team_members: [
        { name: 'Kumoi Njapit', value: 'kumoi_njapit' },
        { name: 'Sam Kumum', value: 'sam_kumum' },
      ],
    };

    expect(normalizeChoiceListValues(formData, formElements)).toEqual({ team_members: ['kumoi_njapit', 'sam_kumum'] });
  });

  it('replaces legacy choice objects holding non string values', () => {
    const formData = { maintenance_action: { name: 'Two', value: 2 }, team_members: [{ name: 'Yes', value: true }] };

    expect(normalizeChoiceListValues(formData, formElements)).toEqual({ maintenance_action: 2, team_members: [true] });
  });

  it('replaces legacy choice objects of a choice list inside a collection', () => {
    const formData = {
      sightings: [
        { species: { name: 'Elephant', value: 'elephant' }, count: 3 },
        { species: { name: 'Zebra', value: 'zebra' }, count: 1 },
      ],
    };

    expect(normalizeChoiceListValues(formData, formElements)).toEqual({
      sightings: [{ species: 'elephant', count: 3 }, { species: 'zebra', count: 1 }],
    });
  });

  it('keeps the items of a collection whose fields are a name and a value', () => {
    const formData = {
      custom_attributes: [{ name: 'Colour', value: 'red' }, { name: 'Size', value: 'XL' }],
    };

    expect(normalizeChoiceListValues(formData, formElements)).toEqual(formData);
  });

  it('leaves the values of fields that are not choice lists untouched', () => {
    const formData = { type_accident: { name: 'Truck crash', value: 'truck_crash' } };

    expect(normalizeChoiceListValues(formData, formElements)).toEqual(formData);
  });

  it('leaves fields missing from the form elements untouched', () => {
    const formData = { removed_field: { name: 'Kumoi Njapit', value: 'kumoi_njapit' } };

    expect(normalizeChoiceListValues(formData, formElements)).toEqual(formData);
  });

  it('leaves the option maps that section conditions use untouched', () => {
    const formData = { maintenance_action: { colocaciondecamara: true } };

    expect(normalizeChoiceListValues(formData, formElements)).toEqual(formData);
  });

  it('leaves already normalized values untouched', () => {
    const formData = { maintenance_action: 'colocaciondecamara', team_members: ['kumoi_njapit'] };

    expect(normalizeChoiceListValues(formData, formElements)).toEqual(formData);
  });

  it('keeps cleared and empty values as they are', () => {
    const formData = { maintenance_action: '', team_members: [], sightings: null };

    expect(normalizeChoiceListValues(formData, formElements)).toEqual(formData);
  });

  it('returns the form data as it is when there are no form elements', () => {
    const formData = { maintenance_action: { name: 'Colocacion de camara', value: 'colocaciondecamara' } };

    expect(normalizeChoiceListValues(formData, null)).toBe(formData);
    expect(normalizeChoiceListValues(formData, undefined)).toBe(formData);
  });

  it('returns non object form data as it is', () => {
    expect(normalizeChoiceListValues(undefined, formElements)).toBeUndefined();
    expect(normalizeChoiceListValues(null, formElements)).toBeNull();
    expect(normalizeChoiceListValues('kumoi_njapit', formElements)).toBe('kumoi_njapit');
  });

  it('preserves the reference of form data that needs no changes', () => {
    const formData = {
      team_members: ['kumoi_njapit'],
      sightings: [{ species: 'elephant', count: 3 }],
    };

    const normalizedFormData = normalizeChoiceListValues(formData, formElements);

    expect(normalizedFormData).toBe(formData);
    expect(normalizedFormData.team_members).toBe(formData.team_members);
    expect(normalizedFormData.sightings).toBe(formData.sightings);
  });

  it('preserves the reference of the values that need no changes', () => {
    const formData = {
      team_members: ['kumoi_njapit'],
      maintenance_action: { name: 'Colocacion de camara', value: 'colocaciondecamara' },
    };

    expect(normalizeChoiceListValues(formData, formElements).team_members).toBe(formData.team_members);
  });
});
