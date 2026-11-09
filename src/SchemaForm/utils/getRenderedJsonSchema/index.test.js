import { FORM_ELEMENT_TYPES } from '../../../utils/form-schemas/constants';

import getRenderedJsonSchema from './';

describe('SchemaForm - utils - getRenderedJsonSchema', () => {
  const formElements = {
    collection: { type: FORM_ELEMENT_TYPES.COLLECTION },
    'collection.nested': { type: FORM_ELEMENT_TYPES.COLLECTION },
    'collection.nested.visible_grandchild': { type: FORM_ELEMENT_TYPES.TEXT },
    'collection.visible_child': { type: FORM_ELEMENT_TYPES.TEXT },
    conditional_field: { type: FORM_ELEMENT_TYPES.TEXT },
    location: { type: FORM_ELEMENT_TYPES.LOCATION },
    visible_field: { type: FORM_ELEMENT_TYPES.TEXT },
  };

  let jsonSchema;
  beforeEach(() => {
    jsonSchema = {
      allOf: [{
        if: { properties: { visible_field: { const: 'a' } }, required: ['visible_field'] },
        then: {
          properties: { conditional_field: { type: 'string' }, hidden_conditional_field: { type: 'string' } },
          required: ['conditional_field', 'hidden_conditional_field'],
        },
        'x-section': 'section-1',
      }],
      properties: {
        collection: {
          items: {
            properties: {
              hidden_child: { type: 'string' },
              nested: {
                items: {
                  properties: { hidden_grandchild: { type: 'string' }, visible_grandchild: { type: 'string' } },
                  required: ['hidden_grandchild', 'visible_grandchild'],
                  type: 'object',
                  unevaluatedProperties: false,
                },
                type: 'array',
              },
              visible_child: { type: 'string' },
            },
            required: ['hidden_child', 'visible_child'],
            type: 'object',
            unevaluatedProperties: false,
          },
          type: 'array',
        },
        hidden_field: { type: 'string' },
        location: {
          properties: { latitude: { maximum: 90, type: 'number' } },
          type: 'object',
          unevaluatedProperties: false,
        },
        visible_field: { type: 'string' },
      },
      required: ['hidden_field', 'visible_field'],
      type: 'object',
      unevaluatedProperties: false,
    };
  });

  test('accepts any value for a field the form does not render', () => {
    const rendered = getRenderedJsonSchema(jsonSchema, formElements);

    expect(rendered.properties.hidden_field).toBe(true);
    expect(rendered.properties.visible_field).toEqual({ type: 'string' });
  });

  test('does not require a field the form does not render', () => {
    expect(getRenderedJsonSchema(jsonSchema, formElements).required).toEqual(['visible_field']);
  });

  test('does not reject stored values the form does not render', () => {
    expect(getRenderedJsonSchema(jsonSchema, formElements).unevaluatedProperties).toBeUndefined();
  });

  test('leaves the subschema of a field the form renders as it is', () => {
    expect(getRenderedJsonSchema(jsonSchema, formElements).properties.location).toEqual(jsonSchema.properties.location);
  });

  test('applies the same rules to the items of collections and nested collections', () => {
    const items = getRenderedJsonSchema(jsonSchema, formElements).properties.collection.items;

    expect(items.properties.hidden_child).toBe(true);
    expect(items.required).toEqual(['visible_child']);
    expect(items.unevaluatedProperties).toBeUndefined();
    expect(items.properties.nested.items.properties.hidden_grandchild).toBe(true);
    expect(items.properties.nested.items.required).toEqual(['visible_grandchild']);
    expect(items.properties.nested.items.unevaluatedProperties).toBeUndefined();
  });

  test('applies the same rules to the fields of conditional sections and keeps their conditions', () => {
    const conditionalSectionSubschema = getRenderedJsonSchema(jsonSchema, formElements).allOf[0];

    expect(conditionalSectionSubschema.if).toBe(jsonSchema.allOf[0].if);
    expect(conditionalSectionSubschema['x-section']).toBe('section-1');
    expect(conditionalSectionSubschema.then.properties.hidden_conditional_field).toBe(true);
    expect(conditionalSectionSubschema.then.required).toEqual(['conditional_field']);
  });

  test('does not change the JSON schema it receives', () => {
    const copy = structuredClone(jsonSchema);

    getRenderedJsonSchema(jsonSchema, formElements);

    expect(jsonSchema).toEqual(copy);
  });

  test('returns the same schema object for the same JSON schema', () => {
    expect(getRenderedJsonSchema(jsonSchema, formElements))
      .toBe(getRenderedJsonSchema(jsonSchema, { ...formElements }));
  });
});
