import { convertSchemaEnumNameObjectsIntoArray } from './sanitizeSchemas';

describe('convertSchemaEnumNameObjectsIntoArray', () => {
  test('returns schema and empty uiEnumNames when properties has no enumNames', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string', title: 'Name' },
        count: { type: 'number' },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema);

    expect(result.schema).toEqual(schema);
    expect(result.uiEnumNames).toEqual({});
  });

  test('converts object-style enumNames: strips from schema and sets uiEnumNames at field path', () => {
    const schema = {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['a', 'b', 'c'],
          enumNames: { a: 'Option A', b: 'Option B', c: 'Option C' },
        },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema);

    expect(result.schema.properties.status).not.toHaveProperty('enumNames');
    expect(result.schema.properties.status.enum).toEqual(['a', 'b', 'c']);
    expect(result.uiEnumNames).toEqual({
      status: ['Option A', 'Option B', 'Option C'],
    });
  });

  test('copies array-style enumNames to uiEnumNames without modifying schema', () => {
    const schema = {
      type: 'object',
      properties: {
        choice: {
          type: 'string',
          enum: ['x', 'y'],
          enumNames: ['Label X', 'Label Y'],
        },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema);

    expect(result.schema.properties.choice.enumNames).toEqual(['Label X', 'Label Y']);
    expect(result.uiEnumNames).toEqual({
      choice: ['Label X', 'Label Y'],
    });
  });

  test('uses path prefix when path argument is provided', () => {
    const schema = {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['on', 'off'],
          enumNames: { on: 'On', off: 'Off' },
        },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema, 'parent');

    expect(result.uiEnumNames).toEqual({
      'parent.level': ['On', 'Off'],
    });
  });

  test('recurses into nested objects and builds correct paths', () => {
    const schema = {
      type: 'object',
      properties: {
        outer: {
          type: 'object',
          properties: {
            inner: {
              type: 'string',
              enum: ['v1'],
              enumNames: { v1: 'Value One' },
            },
          },
        },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema);

    expect(result.schema.properties.outer.properties.inner).not.toHaveProperty('enumNames');
    expect(result.uiEnumNames).toEqual({
      'outer.inner': ['Value One'],
    });
  });

  test('handles array of objects: enums inside items get uiEnumNames at collection.items.fieldName', () => {
    const schema = {
      type: 'object',
      properties: {
        collection: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemType: {
                type: 'string',
                enum: ['t1', 't2'],
                enumNames: { t1: 'Type One', t2: 'Type Two' },
              },
            },
          },
        },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema);

    expect(result.schema.properties.collection.items.properties.itemType).not.toHaveProperty('enumNames');
    expect(result.uiEnumNames).toEqual({
      'collection.items.itemType': ['Type One', 'Type Two'],
    });
  });

  test('handles array of primitives with object-style enumNames on items', () => {
    const schema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['red', 'blue'],
            enumNames: { red: 'Red', blue: 'Blue' },
          },
        },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema);

    expect(result.schema.properties.tags.items).not.toHaveProperty('enumNames');
    expect(result.schema.properties.tags.items.enum).toEqual(['red', 'blue']);
    expect(result.uiEnumNames).toEqual({
      'tags.items': ['Red', 'Blue'],
    });
  });

  test('handles array of primitives with array-style enumNames on items', () => {
    const schema = {
      type: 'object',
      properties: {
        options: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['yes', 'no'],
            enumNames: ['Yes', 'No'],
          },
        },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema);

    expect(result.schema.properties.options.items.enumNames).toEqual(['Yes', 'No']);
    expect(result.uiEnumNames).toEqual({
      'options.items': ['Yes', 'No'],
    });
  });

  test('array with items without enumNames is left unchanged', () => {
    const schema = {
      type: 'object',
      properties: {
        list: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema);

    expect(result.schema).toEqual(schema);
    expect(result.uiEnumNames).toEqual({});
  });

  test('preserves non-enum properties and other schema fields', () => {
    const schema = {
      type: 'object',
      title: 'Root',
      properties: {
        text: { type: 'string', title: 'Text' },
        select: {
          type: 'string',
          enum: ['a'],
          enumNames: { a: 'A' },
        },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema);

    expect(result.schema.type).toBe('object');
    expect(result.schema.title).toBe('Root');
    expect(result.schema.properties.text).toEqual({ type: 'string', title: 'Text' });
    expect(result.schema.properties.select).toEqual({ type: 'string', enum: ['a'] });
    expect(result.uiEnumNames).toEqual({ select: ['A'] });
  });

  test('handles mixed: top-level enum, nested object enum, and array of objects with enum', () => {
    const schema = {
      type: 'object',
      properties: {
        topLevel: {
          type: 'string',
          enum: ['t'],
          enumNames: { t: 'Top' },
        },
        nested: {
          type: 'object',
          properties: {
            inner: {
              type: 'string',
              enum: ['i'],
              enumNames: { i: 'Inner' },
            },
          },
        },
        collection: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemSelect: {
                type: 'string',
                enum: ['c'],
                enumNames: { c: 'Collection Item' },
              },
            },
          },
        },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema);

    expect(result.schema.properties.topLevel).not.toHaveProperty('enumNames');
    expect(result.schema.properties.nested.properties.inner).not.toHaveProperty('enumNames');
    expect(result.schema.properties.collection.items.properties.itemSelect).not.toHaveProperty('enumNames');

    expect(result.uiEnumNames).toEqual({
      topLevel: ['Top'],
      'nested.inner': ['Inner'],
      'collection.items.itemSelect': ['Collection Item'],
    });
  });

  test('handles deeply nested: object containing array of objects containing object with enum', () => {
    const schema = {
      type: 'object',
      properties: {
        level1: {
          type: 'object',
          properties: {
            level2Array: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  level3: {
                    type: 'string',
                    enum: ['v'],
                    enumNames: { v: 'Deep Value' },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema);

    expect(result.uiEnumNames).toEqual({
      'level1.level2Array.items.level3': ['Deep Value'],
    });
  });

  test('handles enum with empty enum array when enumNames is object', () => {
    const schema = {
      type: 'object',
      properties: {
        empty: {
          type: 'string',
          enum: [],
          enumNames: {},
        },
      },
    };

    const result = convertSchemaEnumNameObjectsIntoArray(schema);

    expect(result.schema.properties.empty).not.toHaveProperty('enumNames');
    expect(result.schema.properties.empty.enum).toEqual([]);
    expect(result.uiEnumNames.empty).toEqual([]);
  });
});
