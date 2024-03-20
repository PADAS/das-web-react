import SchemaFactory from './';

describe('Schema Factory', () => {

  it('creates an new empty schema', () => {
    const id = 'myschema.com/shchema.json';
    const schema = SchemaFactory.createNewEmptySchema(id,  'A form', 'some description');
    const { errors } = SchemaFactory.validateSchema(schema);

    expect(errors).toBe(null);

    expect(schema).toEqual({
      '$id': id,
      type: 'object',
      properties: {},
      required: [],
      title: 'A form',
      description: 'some description'
    });
  });

  it('throws validation error when a schema prop is no valid', () => {
    const schema = SchemaFactory.createNewEmptySchema('my-schema.com/schema.json',  null);
    const {  errors } = SchemaFactory.validateSchema(schema);
    const [ error ] = errors;

    expect(error.instancePath).toBe('/title');
  });

  it('Adds string field to an existing schema', () => {
    const schema = SchemaFactory.createNewEmptySchema('my-schema.com/schema.json',  'A form');
    const type = 'string';
    const fieldProps = {
      isRequired: true,
      minLength: 10,
      maxLength: 10
    };
    const field = SchemaFactory.generateField('firstName', type, fieldProps);
    const updatedSchema = SchemaFactory.addFieldsToSchema(schema, field);

    expect(updatedSchema.properties).toEqual({
      firstName: {
        type: 'string',
        minLength: 10,
        maxLength: 10
      }
    });

    const { errors } = SchemaFactory.validateSchema(updatedSchema);
    expect(errors).toBe(null);
  });

  it('Adds several fields at once to an existing schema', () => {
    const schema = SchemaFactory.createNewEmptySchema('my-schema.com/schema.json',  'A form');
    const stringField = SchemaFactory.generateField('firstName', 'string', {
      isRequired: true,
      minLength: 1,
      maxLength: 10
    });
    const numberField = SchemaFactory.generateField('age', 'number', {
      minimum: 0,
      maximum: 100
    });
    const updatedSchema = SchemaFactory.addFieldsToSchema(schema, stringField, numberField);

    expect( updatedSchema.properties ).toEqual({
      firstName: { type: 'string', minLength: 1, maxLength: 10 },
      age: { type: 'number', minimum: 0, maximum: 100 }
    });
    expect(updatedSchema.required).toEqual([ 'firstName' ]);

    const { errors } = SchemaFactory.validateSchema(updatedSchema);
    expect(errors).toBe(null);
  });

  const validateData = (schema, data) => {
    try {
      const validate = SchemaFactory.prepareSchema(schema);
      return validate(data);
    } catch (e){
      return null;
    }
  };

  it('validates data against schema successfully', () => {
    const schema = SchemaFactory.createNewEmptySchema('my-schema.com/schema.json',  'A form');
    const stringField = SchemaFactory.generateField('firstName', 'string', {
      isRequired: true,
      minLength: 1,
      maxLength: 10
    });
    const numberField = SchemaFactory.generateField('age', 'number', {
      minimum: 0,
      maximum: 100
    });
    const updatedSchema = SchemaFactory.addFieldsToSchema(schema, stringField, numberField);
    const data = {
      firstName: 'Gabo',
      age: 20
    };

    expect( validateData(updatedSchema, data) ).toBe(true);
  });

  it('validates data with wrong information against schema', () => {
    const schema = SchemaFactory.createNewEmptySchema('the-schema.com/schema.json',  'A form');
    const numberField = SchemaFactory.generateField('age', 'number', {
      minimum: 0,
      maximum: 100
    });
    const updatedSchema = SchemaFactory.addFieldsToSchema(schema, numberField);
    const data = {
      age: 200
    };

    expect( validateData(updatedSchema, data) ).toBe(false);
  });

  it('validates data against malformed schema', () => {
    const schema = SchemaFactory.createNewEmptySchema('an-schema.com/schema.json',  'A form');
    const numberField = SchemaFactory.generateField('name', 'BAD_TYPE', {
      notAProp: null,
    });
    const updatedSchema = SchemaFactory.addFieldsToSchema(schema, numberField);

    expect( validateData(updatedSchema, { age: 20 }) ).toBe(null);
  });

});