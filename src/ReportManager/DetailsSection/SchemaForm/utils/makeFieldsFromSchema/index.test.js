import makeFieldsFromSchema from '.';
import {
  CHOICE_LIST_ELEMENT_CHOICE_TYPES,
  CHOICE_LIST_ELEMENT_INPUT_TYPES,
  DATE_TIME_ELEMENT_INPUT_TYPES,
  FORM_ELEMENT_TYPES,
  HEADER_ELEMENT_SIZES,
  ROOT_CANVAS_ID,
  TEXT_ELEMENT_INPUT_TYPES,
} from '../../constants';

describe('ReportManager - DetailsSection - SchemaForm - Utils - makeFieldsFromSchema', () => {
  it('creates section fields from the schema', () => {
    const schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        properties: {},
        required: [],
        type: 'object',
      },
      ui: {
        fields: {},
        headers: {},
        order: ['section-1', 'section-2'],
        sections: {
          'section-1': {
            columns: 2,
            isActive: true,
            label: 'Section 1 Label',
            leftColumn: [],
            rightColumn: [],
          },
          'section-2': {
            columns: 1,
            isActive: false,
            label: 'Section 2 Label',
            leftColumn: [],
            rightColumn: [],
          },
        },
      },
    };

    expect(makeFieldsFromSchema(schema)).toEqual({
      [ROOT_CANVAS_ID]: { details: { fields: ['section-1'] } },
      'section-1': {
        details: {
          columns: 2,
          label: 'Section 1 Label',
          leftColumn: [],
          rightColumn: [],
        },
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
  });

  it('creates attachment fields from the schema', () => {
    const schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        properties: {
          'attachment-1': {
            deprecated: false,
            format: 'uri',
            title: 'Attachment 1 Label',
            type: 'string',
          },
          'attachment-2': {
            deprecated: true,
            format: 'uri',
            title: 'Attachment 2 Label',
            type: 'string',
          },
        },
        required: ['attachment-1'],
        type: 'object',
      },
      ui: {
        fields: {
          'attachment-1': {
            allowableFileTypes: ['image', 'video'],
            type: 'ATTACHMENT',
            parent: 'section-1',
          },
          'attachment-2': {
            allowableFileTypes: [],
            type: 'ATTACHMENT',
            parent: 'section-1',
          },
        },
        headers: {},
        order: ['section-1'],
        sections: {
          'section-1': {
            columns: 2,
            isActive: true,
            label: 'Section 1 Label',
            leftColumn: [
              {
                name: 'attachment-1',
                type: 'field',
              },
            ],
            rightColumn: [
              {
                name: 'attachment-2',
                type: 'field',
              },
            ],
          },
        },
      },
    };

    expect(makeFieldsFromSchema(schema)).toEqual({
      'attachment-1': {
        details: {
          allowableFileTypes: ['image', 'video'],
          isRequired: true,
          label: 'Attachment 1 Label',
          value: 'attachment-1',
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
      [ROOT_CANVAS_ID]: { details: { fields: ['section-1'] } },
      'section-1': {
        details: {
          columns: 2,
          label: 'Section 1 Label',
          leftColumn: ['attachment-1'],
          rightColumn: [],
        },
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
  });

  it('creates choice list fields from the schema', () => {
    const schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        properties: {
          'choice-list-1': {
            deprecated: false,
            description: 'Choice List 1 Description',
            title: 'Choice List 1 Label',
            type: 'array',
            uniqueItems: true,
            items: {
              type: 'string',
              anyOf: [
                {
                  $ref: 'http://localhost/schemas/existing/snarerep_status.json',
                },
              ],
            },
          },
          'choice-list-2': {
            deprecated: true,
            description: 'Choice List 2 Description',
            title: 'Choice List 2 Label',
            type: 'string',
            anyOf: [
              {
                $ref: 'http://localhost/schemas/feature-category/a9ac339d-ecf1-4b49-bf22-467058af31cf.json',
              },
            ],
          },
        },
        required: ['choice-list-1'],
        type: 'object',
      },
      ui: {
        fields: {
          'choice-list-1': {
            choices: {
              eventTypeCategories: [],
              existingChoiceList: ['snarerep_status'],
              featureCategories: [],
              myDataType: '',
              subjectGroups: [],
              subjectSubtypes: [],
              type: 'EXISTING_CHOICE_LIST',
            },
            inputType: 'DROPDOWN',
            placeholder: 'Choice List 1 Hint',
            type: 'CHOICE_LIST',
            parent: 'section-1',
          },
          'choice-list-2': {
            choices: {
              eventTypeCategories: [],
              existingChoiceList: [],
              featureCategories: ['a9ac339d-ecf1-4b49-bf22-467058af31cf'],
              myDataType: 'FEATURE_CLASSES_FROM_FEATURE_CATEGORY',
              subjectGroups: [],
              subjectSubtypes: [],
              type: 'MY_DATA',
            },
            inputType: 'LIST',
            placeholder: 'Choice List 2 Hint',
            type: 'CHOICE_LIST',
            parent: 'section-1',
          },
        },
        headers: {},
        order: ['section-1'],
        sections: {
          'section-1': {
            columns: 2,
            isActive: true,
            label: 'Section 1 Label',
            leftColumn: [
              {
                name: 'choice-list-1',
                type: 'field',
              },
            ],
            rightColumn: [
              {
                name: 'choice-list-2',
                type: 'field',
              },
            ],
          },
        },
      },
    };

    expect(makeFieldsFromSchema(schema)).toEqual({
      'choice-list-1': {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: ['snarerep_status'],
            featureCategories: [],
            myDataType: '',
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.EXISTING_CHOICE_LIST,
          },
          description: 'Choice List 1 Description',
          hint: 'Choice List 1 Hint',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN,
          isRequired: true,
          label: 'Choice List 1 Label',
          multiple: true,
          value: 'choice-list-1',
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
      [ROOT_CANVAS_ID]: { details: { fields: ['section-1'] } },
      'section-1': {
        details: {
          columns: 2,
          label: 'Section 1 Label',
          leftColumn: ['choice-list-1'],
          rightColumn: [],
        },
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
  });

  it('creates date time fields from the schema', () => {
    const schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        properties: {
          'date-time-1': {
            deprecated: false,
            description: 'Date Time 1 Description',
            format: 'date-time',
            title: 'Date Time 1 Label',
            type: 'string',
          },
          'date-time-2': {
            deprecated: true,
            description: 'Date Time 2 Description',
            format: 'time',
            title: 'Date Time 2 Label',
            type: 'string',
          },
        },
        required: ['date-time-1'],
        type: 'object',
      },
      ui: {
        fields: {
          'date-time-1': {
            type: 'DATE_TIME',
            parent: 'section-1',
          },
          'date-time-2': {
            type: 'DATE_TIME',
            parent: 'section-1',
          },
        },
        headers: {},
        order: ['section-1'],
        sections: {
          'section-1': {
            columns: 2,
            isActive: true,
            label: 'Section 1 Label',
            leftColumn: [
              {
                name: 'date-time-1',
                type: 'field',
              },
            ],
            rightColumn: [
              {
                name: 'date-time-2',
                type: 'field',
              },
            ],
          },
        },
      },
    };

    expect(makeFieldsFromSchema(schema)).toEqual({
      'date-time-1': {
        details: {
          description: 'Date Time 1 Description',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
          isRequired: true,
          label: 'Date Time 1 Label',
          value: 'date-time-1',
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
      [ROOT_CANVAS_ID]: { details: { fields: ['section-1'] } },
      'section-1': {
        details: {
          columns: 2,
          label: 'Section 1 Label',
          leftColumn: ['date-time-1'],
          rightColumn: [],
        },
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
  });

  it('creates header fields from the schema', () => {
    const schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        properties: {},
        required: [],
        type: 'object',
      },
      ui: {
        fields: {},
        headers: {
          'header-1': {
            label: 'Header 1 Label',
            section: 'section-1',
            size: 'LARGE',
          },
          'header-2': {
            label: 'Header 2 Label',
            section: 'section-1',
            size: 'SMALL',
          },
        },
        order: ['section-1'],
        sections: {
          'section-1': {
            columns: 2,
            isActive: true,
            label: 'Section 1 Label',
            leftColumn: [
              {
                name: 'header-1',
                type: 'header',
              },
            ],
            rightColumn: [
              {
                name: 'header-2',
                type: 'header',
              },
            ],
          },
        },
      },
    };

    expect(makeFieldsFromSchema(schema)).toEqual({
      'header-1': {
        details: {
          label: 'Header 1 Label',
          size: HEADER_ELEMENT_SIZES.LARGE,
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.HEADER,
      },
      'header-2': {
        details: {
          label: 'Header 2 Label',
          size: HEADER_ELEMENT_SIZES.SMALL,
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.HEADER,
      },
      [ROOT_CANVAS_ID]: { details: { fields: ['section-1'] } },
      'section-1': {
        details: {
          columns: 2,
          label: 'Section 1 Label',
          leftColumn: ['header-1'],
          rightColumn: ['header-2'],
        },
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
  });

  it('creates location fields from the schema', () => {
    const schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        properties: {
          'location-1': {
            deprecated: false,
            description: 'Location 1 Description',
            properties: {
              latitude: {
                maximum: 90,
                minimum: -90,
                type: 'number',
              },
              longitude: {
                maximum: 180,
                minimum: -180,
                type: 'number',
              },
            },
            title: 'Location 1 Label',
            type: 'object',
          },
          'location-2': {
            deprecated: true,
            description: 'Location 2 Description',
            properties: {
              latitude: {
                maximum: 90,
                minimum: -90,
                type: 'number',
              },
              longitude: {
                maximum: 180,
                minimum: -180,
                type: 'number',
              },
            },
            title: 'Location 2 Label',
            type: 'object',
          },
        },
        required: ['location-1'],
        type: 'object',
      },
      ui: {
        fields: {
          'location-1': {
            type: 'LOCATION',
            parent: 'section-1',
          },
          'location-2': {
            type: 'LOCATION',
            parent: 'section-1',
          },
        },
        headers: {},
        order: ['section-1'],
        sections: {
          'section-1': {
            columns: 2,
            isActive: true,
            label: 'Section 1 Label',
            leftColumn: [
              {
                name: 'location-1',
                type: 'field',
              },
            ],
            rightColumn: [
              {
                name: 'location-2',
                type: 'field',
              },
            ],
          },
        },
      },
    };

    expect(makeFieldsFromSchema(schema)).toEqual({
      'location-1': {
        details: {
          description: 'Location 1 Description',
          isRequired: true,
          label: 'Location 1 Label',
          value: 'location-1',
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
      [ROOT_CANVAS_ID]: { details: { fields: ['section-1'] } },
      'section-1': {
        details: {
          columns: 2,
          label: 'Section 1 Label',
          leftColumn: ['location-1'],
          rightColumn: [],
        },
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
  });

  it('creates numeric fields from the schema', () => {
    const schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        properties: {
          'numeric-1': {
            default: 5,
            deprecated: false,
            description: 'Numeric 1 Description',
            maximum: 10,
            minimum: 0,
            title: 'Numeric 1 Label',
            type: 'number',
          },
          'numeric-2': {
            deprecated: true,
            description: 'Numeric 2 Description',
            title: 'Numeric 2 Label',
            type: 'number',
          },
        },
        required: ['numeric-1'],
        type: 'object',
      },
      ui: {
        fields: {
          'numeric-1': {
            placeholder: 'Numeric 1 Hint',
            type: 'NUMERIC',
            parent: 'section-1',
          },
          'numeric-2': {
            placeholder: 'Numeric 2 Hint',
            type: 'NUMERIC',
            parent: 'section-1',
          },
        },
        headers: {},
        order: ['section-1'],
        sections: {
          'section-1': {
            columns: 2,
            isActive: true,
            label: 'Section 1 Label',
            leftColumn: [
              {
                name: 'numeric-1',
                type: 'field',
              },
            ],
            rightColumn: [
              {
                name: 'numeric-2',
                type: 'field',
              },
            ],
          },
        },
      },
    };

    expect(makeFieldsFromSchema(schema)).toEqual({
      'numeric-1': {
        details: {
          defaultInput: 5,
          description: 'Numeric 1 Description',
          placeholder: 'Numeric 1 Hint',
          isRequired: true,
          label: 'Numeric 1 Label',
          maxInput: 10,
          minInput: 0,
          value: 'numeric-1',
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
      [ROOT_CANVAS_ID]: { details: { fields: ['section-1'] } },
      'section-1': {
        details: {
          columns: 2,
          label: 'Section 1 Label',
          leftColumn: ['numeric-1'],
          rightColumn: [],
        },
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
  });

  it('creates text fields from the schema', () => {
    const schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        properties: {
          'text-1': {
            default: 'Text 1 Default Input',
            deprecated: false,
            description: 'Text 1 Description',
            title: 'Text 1 Label',
            type: 'string',
          },
          'text-2': {
            default: 'Text 2 Default Input',
            deprecated: true,
            description: 'Text 2 Description',
            title: 'Text 2 Label',
            type: 'string',
          },
        },
        required: ['text-1'],
        type: 'object',
      },
      ui: {
        fields: {
          'text-1': {
            inputType: 'SHORT_TEXT',
            placeholder: 'Text 1 Placeholder',
            type: 'TEXT',
            parent: 'section-1',
          },
          'text-2': {
            inputType: 'LONG_TEXT',
            placeholder: 'Text 2 Placeholder',
            type: 'TEXT',
            parent: 'section-1',
          },
        },
        headers: {},
        order: ['section-1'],
        sections: {
          'section-1': {
            columns: 2,
            isActive: true,
            label: 'Section 1 Label',
            leftColumn: [
              {
                name: 'text-1',
                type: 'field',
              },
            ],
            rightColumn: [
              {
                name: 'text-2',
                type: 'field',
              },
            ],
          },
        },
      },
    };

    expect(makeFieldsFromSchema(schema)).toEqual({
      'text-1': {
        details: {
          defaultInput: 'Text 1 Default Input',
          description: 'Text 1 Description',
          inputType: TEXT_ELEMENT_INPUT_TYPES.SHORT,
          isRequired: true,
          label: 'Text 1 Label',
          placeholder: 'Text 1 Placeholder',
          value: 'text-1',
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.TEXT,
      },
      [ROOT_CANVAS_ID]: { details: { fields: ['section-1'] } },
      'section-1': {
        details: {
          columns: 2,
          label: 'Section 1 Label',
          leftColumn: ['text-1'],
          rightColumn: [],
        },
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
  });

  it('creates collection fields from the schema', () => {
    const schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        properties: {
          'collection-1': {
            deprecated: false,
            items: {
              additionalProperties: false,
              properties: {
                'attachment-1': {
                  deprecated: false,
                  format: 'uri',
                  title: 'Attachment 1 Label',
                  type: 'string',
                },
                'collection-3': {
                  deprecated: false,
                  items: {
                    additionalProperties: false,
                    properties: {
                      'location-1': {
                        deprecated: false,
                        description: 'Location 1 Description',
                        properties: {
                          latitude: {
                            maximum: 90,
                            minimum: -90,
                            type: 'number',
                          },
                          longitude: {
                            maximum: 180,
                            minimum: -180,
                            type: 'number',
                          },
                        },
                        title: 'Location 1 Label',
                        type: 'object',
                      },
                    },
                    required: ['location-1'],
                    type: 'object',
                  },
                  title: 'Collection 3 Label',
                  type: 'array',
                  unevaluatedItems: false,
                },
                'choice-list-1': {
                  deprecated: false,
                  description: 'Choice List 1 Description',
                  title: 'Choice List 1 Label',
                  type: 'array',
                  uniqueItems: true,
                  items: {
                    type: 'string',
                    anyOf: [
                      {
                        $ref: 'http://localhost/schemas/existing/snarerep_status.json',
                      },
                    ],
                  },
                },
                'date-time-1': {
                  deprecated: false,
                  description: 'Date Time 1 Description',
                  format: 'date-time',
                  title: 'Date Time 1 Label',
                  type: 'string',
                },
              },
              required: ['attachment-1', 'choice-list-1', 'date-time-1'],
              type: 'object',
            },
            maxItems: 10,
            minItems: 0,
            title: 'Collection 1 Label',
            type: 'array',
            unevaluatedItems: false,
          },
          'collection-2': {
            deprecated: true,
            items: {
              additionalProperties: false,
              properties: {},
              required: [],
              type: 'object',
            },
            title: 'Collection 2 Label',
            type: 'array',
            unevaluatedItems: false,
          },
        },
        required: [],
        type: 'object',
      },
      ui: {
        fields: {
          'collection-1': {
            buttonText: 'Collection 1 Button Text',
            columns: 2,
            itemIdentifier: '',
            itemName: 'Collection 1 Item Name',
            leftColumn: ['attachment-1', 'collection-3'],
            rightColumn: ['choice-list-1', 'date-time-1'],
            type: 'COLLECTION',
            parent: 'section-1',
          },
          'collection-2': {
            buttonText: 'Collection 2 Button Text',
            columns: 1,
            itemIdentifier: '',
            itemName: 'Collection 2 Item Name',
            leftColumn: [],
            rightColumn: [],
            type: 'COLLECTION',
            parent: 'section-1',
          },
          'attachment-1': {
            allowableFileTypes: ['image', 'video'],
            type: 'ATTACHMENT',
            parent: 'collection-1',
          },
          'collection-3': {
            buttonText: 'Collection 3 Button Text',
            columns: 2,
            itemIdentifier: '',
            itemName: 'Collection 3 Item Name',
            leftColumn: ['location-1'],
            rightColumn: [],
            type: 'COLLECTION',
            parent: 'collection-1',
          },
          'choice-list-1': {
            choices: {
              eventTypeCategories: [],
              existingChoiceList: ['snarerep_status'],
              featureCategories: [],
              myDataType: '',
              subjectGroups: [],
              subjectSubtypes: [],
              type: 'EXISTING_CHOICE_LIST',
            },
            inputType: 'DROPDOWN',
            placeholder: 'Choice List 1 Hint',
            type: 'CHOICE_LIST',
            parent: 'collection-1',
          },
          'date-time-1': {
            type: 'DATE_TIME',
            parent: 'collection-1',
          },
          'location-1': {
            type: 'LOCATION',
            parent: 'collection-3',
          },
        },
        headers: {},
        order: ['section-1'],
        sections: {
          'section-1': {
            columns: 2,
            isActive: true,
            label: 'Section 1 Label',
            leftColumn: [
              {
                name: 'collection-1',
                type: 'field',
              },
            ],
            rightColumn: [
              {
                name: 'collection-2',
                type: 'field',
              },
            ],
          },
        },
      },
    };

    expect(makeFieldsFromSchema(schema)).toEqual({
      'attachment-1': {
        details: {
          allowableFileTypes: ['image', 'video'],
          isRequired: true,
          label: 'Attachment 1 Label',
          value: 'attachment-1',
        },
        parentId: 'collection-1',
        type: FORM_ELEMENT_TYPES.ATTACHMENT,
      },
      'choice-list-1': {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: ['snarerep_status'],
            featureCategories: [],
            myDataType: '',
            subjectGroups: [],
            subjectSubtypes: [],
            type: 'EXISTING_CHOICE_LIST',
          },
          description: 'Choice List 1 Description',
          hint: 'Choice List 1 Hint',
          inputType: 'DROPDOWN',
          isRequired: true,
          label: 'Choice List 1 Label',
          multiple: true,
          value: 'choice-list-1',
        },
        parentId: 'collection-1',
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
      'collection-1': {
        details: {
          buttonText: 'Collection 1 Button Text',
          columns: 2,
          itemIdentifier: '',
          itemName: 'Collection 1 Item Name',
          label: 'Collection 1 Label',
          leftColumn: ['attachment-1', 'collection-3'],
          maxItems: 10,
          minItems: 0,
          rightColumn: ['choice-list-1', 'date-time-1'],
          value: 'collection-1',
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
      'collection-3': {
        details: {
          buttonText: 'Collection 3 Button Text',
          columns: 2,
          itemIdentifier: '',
          itemName: 'Collection 3 Item Name',
          label: 'Collection 3 Label',
          leftColumn: ['location-1'],
          maxItems: null,
          minItems: null,
          rightColumn: [],
          value: 'collection-3',
        },
        parentId: 'collection-1',
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
      'date-time-1': {
        details: {
          description: 'Date Time 1 Description',
          inputType: 'DATE_TIME',
          isRequired: true,
          label: 'Date Time 1 Label',
          value: 'date-time-1',
        },
        parentId: 'collection-1',
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
      'location-1': {
        details: {
          description: 'Location 1 Description',
          isRequired: true,
          label: 'Location 1 Label',
          value: 'location-1',
        },
        parentId: 'collection-3',
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
      root: { details: { fields: ['section-1'] } },
      'section-1': {
        details: {
          columns: 2,
          label: 'Section 1 Label',
          leftColumn: ['collection-1'],
          rightColumn: [],
        },
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    });
  });
});
