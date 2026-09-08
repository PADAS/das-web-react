export const patrolTypeFieldsSchema = {
  json: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    properties: {
      driver_name: {
        anyOf: [
          { enum: ['amara-osei'], 'x-enumExtra': { 'amara-osei': { description: '', display: 'Amara Osei' } } },
          { enum: ['jordan-reeves'], 'x-enumExtra': { 'jordan-reeves': { description: '', display: 'Jordan Reeves' } } },
        ],
        deprecated: false,
        description: '',
        title: 'Driver Name',
        type: 'string',
      },
      vehicle_name: {
        deprecated: false,
        description: '',
        title: 'Vehicle Name',
        type: 'string',
      },
    },
    required: [],
    type: 'object',
    unevaluatedProperties: false,
  },
  ui: {
    fields: {
      driver_name: {
        conditionalDependents: [],
        inputType: 'DROPDOWN',
        parent: 'patrolTypeFields',
        placeholder: '',
        type: 'CHOICE_LIST',
      },
      vehicle_name: {
        conditionalDependents: [],
        inputType: 'SHORT_TEXT',
        parent: 'patrolTypeFields',
        placeholder: '',
        type: 'TEXT',
      },
    },
    headers: {},
    order: ['patrolTypeFields'],
    sections: {
      patrolTypeFields: {
        columns: 2,
        conditions: [],
        isActive: true,
        label: '',
        leftColumn: [{ name: 'driver_name', type: 'field' }],
        rightColumn: [{ name: 'vehicle_name', type: 'field' }],
      },
    },
  },
};

export const defaultPatrolSegmentTypeSchema = {
  json: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    properties: {
      objective: {
        deprecated: false,
        description: '',
        title: 'Objective',
        type: 'string',
      },
      station: {
        anyOf: [
          { enum: ['station-1'], 'x-enumExtra': { 'station-1': { description: '', display: 'Station 1' } } },
          { enum: ['station-2'], 'x-enumExtra': { 'station-2': { description: '', display: 'Station 2' } } },
        ],
        deprecated: false,
        description: '',
        title: 'Station',
        type: 'string',
      },
    },
    required: [],
    type: 'object',
    unevaluatedProperties: false,
  },
  ui: {
    fields: {
      objective: {
        conditionalDependents: [],
        inputType: 'SHORT_TEXT',
        parent: 'universalPatrolFields',
        placeholder: '',
        type: 'TEXT',
      },
      station: {
        conditionalDependents: [],
        inputType: 'DROPDOWN',
        parent: 'universalPatrolFields',
        placeholder: '',
        type: 'CHOICE_LIST',
      },
    },
    headers: {},
    order: ['universalPatrolFields'],
    sections: {
      universalPatrolFields: {
        columns: 2,
        conditions: [],
        isActive: true,
        label: '',
        leftColumn: [{ name: 'objective', type: 'field' }],
        rightColumn: [{ name: 'station', type: 'field' }],
      },
    },
  },
};
