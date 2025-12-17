const eventtypesFixture = {
  data: [
    {
      id: '29736bf4-c1eb-4cb7-bdb2-3b6464108517',
      has_events_assigned: true,
      icon: 'animal_control_rep',
      value: 'animal_control_v2',
      display: 'Animal Control v2',
      ordernum: 1,
      is_collection: false,
      category: 'security',
      icon_id: 'animal_control_rep',
      is_active: true,
      default_priority: 0,
      default_state: 'active',
      geometry_type: 'Point',
      resolve_time: null,
      auto_resolve: false,
      url: 'https://stage.pamdas.org/api/v2.0/activity/eventtypes/animal_control_v2',
    },
    {
      id: 'bbd64930-a029-4d89-98f2-f94e269f8fe6',
      has_events_assigned: true,
      icon: 'fire_rep',
      value: 'fire_v2',
      display: 'Fire v2',
      ordernum: 2,
      is_collection: false,
      category: 'monitoring',
      icon_id: 'fire_rep',
      is_active: true,
      default_priority: 300,
      default_state: 'active',
      geometry_type: 'Polygon',
      resolve_time: null,
      auto_resolve: false,
      url: 'https://stage.pamdas.org/api/v2.0/activity/eventtypes/fire_v2',
    },
    {
      id: '551d9203-a74c-4107-b727-681cc10c6f3e',
      has_events_assigned: false,
      icon: 'light_rep',
      value: 'light_v2',
      display: 'Light v2',
      ordernum: 3,
      is_collection: false,
      category: 'security',
      icon_id: 'light_rep',
      is_active: true,
      default_priority: 100,
      default_state: 'active',
      geometry_type: 'Point',
      resolve_time: 2,
      auto_resolve: true,
      url: 'https://stage.pamdas.org/api/v2.0/activity/eventtypes/light_v2',
    },
  ],
  status: {
    code: 200,
    message: 'OK',
  },
};

const eventtypeSchemaFixtures = {
  animal_control_v2: {
    json: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      properties: {
        number_of_shots_fired: {
          deprecated: false,
          description: '',
          title: 'Number of Shots Fired',
          type: 'number',
        },
        animal_species: {
          default: '',
          deprecated: false,
          description: '',
          title: 'Animal Species',
          type: 'string',
        },
        number_of_animals: {
          deprecated: false,
          description: '',
          minimum: 1,
          title: 'Number of Animals',
          type: 'number',
        },
        reason_animal_control_needed: {
          default: '',
          deprecated: false,
          description: 'Brief description of the decision',
          title: 'Reason Animal Control Needed',
          type: 'string',
        },
      },
      required: ['animal_species', 'number_of_animals'],
      type: 'object',
      unevaluatedProperties: false,
    },
    ui: {
      fields: {
        number_of_shots_fired: {
          placeholder: '',
          type: 'NUMERIC',
          parent: 'section-9ytDR-VkTZeTXwgT08_65',
        },
        animal_species: {
          inputType: 'SHORT_TEXT',
          placeholder: 'Rhino',
          type: 'TEXT',
          parent: 'section-9ytDR-VkTZeTXwgT08_65',
        },
        number_of_animals: {
          placeholder: '',
          type: 'NUMERIC',
          parent: 'section-9ytDR-VkTZeTXwgT08_65',
        },
        reason_animal_control_needed: {
          inputType: 'LONG_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-9ytDR-VkTZeTXwgT08_65',
        },
      },
      headers: {},
      order: ['section-9ytDR-VkTZeTXwgT08_65'],
      sections: {
        'section-9ytDR-VkTZeTXwgT08_65': {
          columns: 2,
          isActive: true,
          label: '',
          leftColumn: [
            { name: 'animal_species', type: 'field' },
            { name: 'reason_animal_control_needed', type: 'field' },
          ],
          rightColumn: [
            { name: 'number_of_animals', type: 'field' },
            { name: 'number_of_shots_fired', type: 'field' },
          ],
        },
      },
    },
  },
  fire_v2: {
    json: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      properties: {
        direction_fire_is_moving: {
          default: '',
          deprecated: false,
          description: '',
          title: 'Direction Fire is Moving',
          type: 'string',
        },
        status: {
          default: 'Active',
          deprecated: false,
          description: '',
          title: 'Status',
          type: 'string',
        },
        cause: {
          default: '',
          deprecated: false,
          description: 'Probable cause of the fire',
          title: 'Cause',
          type: 'string',
        },
      },
      required: ['direction_fire_is_moving', 'status'],
      type: 'object',
      unevaluatedProperties: false,
    },
    ui: {
      fields: {
        direction_fire_is_moving: {
          inputType: 'SHORT_TEXT',
          placeholder: 'Norht, East, South, West...',
          type: 'TEXT',
          parent: 'section-9ytDR-VkTZeTXwgT08_65',
        },
        status: {
          inputType: 'SHORT_TEXT',
          placeholder: 'Active, Inactive',
          type: 'TEXT',
          parent: 'section-9ytDR-VkTZeTXwgT08_65',
        },
        cause: {
          inputType: 'LONG_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-9ytDR-VkTZeTXwgT08_65',
        },
      },
      headers: {},
      order: ['section-9ytDR-VkTZeTXwgT08_65'],
      sections: {
        'section-9ytDR-VkTZeTXwgT08_65': {
          columns: 2,
          isActive: true,
          label: '',
          leftColumn: [
            { name: 'status', type: 'field' },
            { name: 'direction_fire_is_moving', type: 'field' },
          ],
          rightColumn: [{ name: 'cause', type: 'field' }],
        },
      },
    },
  },
  light_v2: {
    json: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      properties: {
        what_was_detected: {
          default: '',
          deprecated: false,
          description: '',
          title: 'What was detected',
          type: 'string',
        },
        bearing: {
          deprecated: false,
          description: '0-360',
          maximum: 360,
          minimum: 0,
          title: 'Bearing',
          type: 'number',
        },
        distance: {
          deprecated: false,
          description: 'In meters',
          title: 'Distance',
          type: 'number',
        },
        description_of_activity: {
          default: '',
          deprecated: false,
          description: '',
          title: 'Description of activity',
          type: 'string',
        },
        'patrols_response_/_intent': {
          default: '',
          deprecated: false,
          description: '',
          title: 'Patrols response / intent',
          type: 'string',
        },
      },
      required: ['what_was_detected'],
      type: 'object',
      unevaluatedProperties: false,
    },
    ui: {
      fields: {
        what_was_detected: {
          inputType: 'SHORT_TEXT',
          placeholder: 'Camp fire, smoke, torch...',
          type: 'TEXT',
          parent: 'section-9ytDR-VkTZeTXwgT08_65',
        },
        bearing: {
          placeholder: '',
          type: 'NUMERIC',
          parent: 'section-9ytDR-VkTZeTXwgT08_65',
        },
        distance: {
          placeholder: '',
          type: 'NUMERIC',
          parent: 'section-9ytDR-VkTZeTXwgT08_65',
        },
        description_of_activity: {
          inputType: 'LONG_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-9ytDR-VkTZeTXwgT08_65',
        },
        'patrols_response_/_intent': {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-9ytDR-VkTZeTXwgT08_65',
        },
      },
      headers: {},
      order: ['section-9ytDR-VkTZeTXwgT08_65'],
      sections: {
        'section-9ytDR-VkTZeTXwgT08_65': {
          columns: 2,
          isActive: true,
          label: '',
          leftColumn: [
            { name: 'what_was_detected', type: 'field' },
            { name: 'distance', type: 'field' },
            { name: 'patrols_response_/_intent', type: 'field' },
          ],
          rightColumn: [
            { name: 'bearing', type: 'field' },
            { name: 'description_of_activity', type: 'field' },
          ],
        },
      },
    },
  },
};

module.exports = { eventtypesFixture, eventtypeSchemaFixtures };
