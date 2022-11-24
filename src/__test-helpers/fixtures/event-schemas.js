export const eventSchemas = {
  globalSchema: {
    $schema: 'http://json-schema.org/draft-04/schema#',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        required: false,
        title: 'Id'
      },
      location: {
        type: 'string',
        required: false,
        title: 'Location'
      },
      time: {
        type: 'string',
        required: false,
        title: 'Time'
      },
      end_time: {
        type: 'string',
        required: false,
        title: 'End Time'
      },
      serial_number: {
        type: 'integer',
        required: false,
        title: 'Serial Number',
        minimum: -9223372036854776000,
        maximum: 9223372036854776000
      },
      message: {
        type: 'string',
        required: false,
        title: 'Message'
      },
      provenance: {
        type: 'object',
        required: false,
        title: 'Provenance',
        enum_ext: [
          {
            value: 'staff',
            title: 'Staff'
          },
          {
            value: 'system',
            title: 'System Process'
          },
          {
            value: 'sensor',
            title: 'Sensor'
          },
          {
            value: 'analyzer',
            title: 'Analyzer'
          },
          {
            value: 'community',
            title: 'Community'
          }
        ],
        enum: [
          'staff',
          'system',
          'sensor',
          'analyzer',
          'community'
        ]
      },
      event_type: {
        type: 'object',
        required: false,
        title: 'Event type',
        enum_ext: [
          {
            value: 'immobility',
            title: 'Immobility'
          },
          {
            value: 'immobility_all_clear',
            title: 'Immobility All Clear'
          },
          {
            value: 'low_speed_wilcoxon',
            title: 'Low Speed (Wilcoxon)'
          },
          {
            value: 'low_speed_wilcoxon_all_clear',
            title: 'Low Speed (Wilcoxon) All Clear'
          },
          {
            value: 'low_speed_percentile',
            title: 'Low Speed (Percentile)'
          },
          {
            value: 'geofence_break',
            title: 'Geofence Break'
          },
          {
            value: 'proximity',
            title: 'Proximity'
          },
          {
            value: 'subject_proximity',
            title: 'Subject Proximity'
          },
          {
            value: 'firms_rep',
            title: 'FIRMS Report'
          },
          {
            value: 'silence_source_provider_rep',
            title: 'Silent Source Provider'
          },
          {
            value: 'silence_source_rep',
            title: 'Silent Source'
          },
          {
            value: 'gfw_activefire_alert',
            title: 'Active Fire Alert (GFW)'
          },
          {
            value: 'gfw_glad_alert',
            title: 'GLAD Tree-Loss Alert (GFW)'
          },
          {
            value: 'acoustic_detection',
            title: 'Acoustic Detection'
          }
        ],
        enum: [
          'immobility',
          'immobility_all_clear',
          'low_speed_wilcoxon',
          'low_speed_wilcoxon_all_clear',
          'low_speed_percentile',
          'geofence_break',
          'proximity',
          'subject_proximity',
          'firms_rep',
          'silence_source_provider_rep',
          'silence_source_rep',
          'gfw_activefire_alert',
          'gfw_glad_alert',
          'acoustic_detection'
        ]
      },
      priority: {
        type: 'object',
        required: false,
        title: 'Priority',
        enum_ext: [
          {
            value: 0,
            title: 'Gray'
          },
          {
            value: 100,
            title: 'Green'
          },
          {
            value: 200,
            title: 'Amber'
          },
          {
            value: 300,
            title: 'Red'
          }
        ],
        enum: [
          0,
          100,
          200,
          300
        ]
      },
      priority_label: {
        type: 'object',
        required: false,
        title: 'Priority label'
      },
      attributes: {
        type: 'object',
        required: false,
        title: 'Attributes'
      },
      comment: {
        type: 'string',
        required: false,
        title: 'Comment'
      },
      title: {
        type: 'string',
        required: false,
        title: 'Title'
      },
      created_by_user: {
        type: 'object',
        required: false,
        title: 'Created by user'
      },
      notes: {
        type: 'object',
        required: false,
        title: 'Notes'
      },
      reported_by: {
        type: 'object',
        required: false,
        title: 'Reported by',
        enum: [
          {
            name: 'Informant',
            id: '9ec20ec8-516c-40bd-a4a3-9a2b49f5ea40',
            content_type: 'activity.community'
          }
        ],
        enum_ext: [
          {
            value: {
              name: 'Informant',
              id: '9ec20ec8-516c-40bd-a4a3-9a2b49f5ea40',
              content_type: 'activity.community'
            },
            title: 'Informant'
          }
        ]
      },
      state: {
        type: 'object',
        required: false,
        title: 'State',
        enum_ext: [
          {
            value: 'new',
            title: 'New'
          },
          {
            value: 'active',
            title: 'Active'
          },
          {
            value: 'resolved',
            title: 'Resolved'
          }
        ],
        enum: [
          'new',
          'active',
          'resolved'
        ]
      },
      event_details: {
        type: 'object',
        required: false,
        title: 'Event details'
      },
      is_contained_in: {
        type: 'object',
        required: false,
        title: 'Is contained in'
      },
      files: {
        type: 'object',
        required: false,
        title: 'Files'
      },
      related_subjects: {
        type: 'object',
        required: false,
        title: 'Related subjects'
      },
      eventsource: {
        type: 'object',
        required: false,
        title: 'Eventsource',
        enum_ext: [],
        enum: []
      },
      external_event_id: {
        type: 'string',
        required: false,
        title: 'External event id',
        maxLength: 100
      },
      sort_at: {
        type: 'string',
        required: false,
        title: 'Sort at'
      },
      patrol_segments: {
        type: 'object',
        required: false,
        title: 'Patrol segments'
      },
      geometry: {
        type: 'object',
        required: false,
        title: 'Geometry',
        enum_ext: [],
        enum: []
      },
      updated_at: {
        type: 'string',
        required: false,
        title: 'Updated at'
      },
      created_at: {
        type: 'string',
        required: false,
        title: 'Created at'
      },
      icon_id: {
        type: 'object',
        required: false,
        title: 'Icon id'
      }
    },
    required: [],
    dependencies: {},
    description: ''
  },
  wildlife_sighting_rep: {
    'a78576a5-3c5b-40df-b374-12db53fbfdd6': {
      definition: [
        {
          key: 'wildlifesightingrep_species',
          htmlClass: 'col-lg-6'
        },
        {
          key: 'wildlifesightingrep_numberanimals',
          htmlClass: 'col-lg-6'
        },
        {
          key: 'wildlifesightingrep_collared',
          htmlClass: 'col-lg-6'
        }
      ],
      schema: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        title: 'Other Wildlife Sighting Report (wildlife_sighting_rep)',
        type: 'object',
        properties: {
          wildlifesightingrep_species: {
            type: 'string',
            title: 'Species',
            enum: [
              'bongo',
              'buffalo',
              'cheetah',
              'chimpanzee',
              'crocodile',
              'eland',
              'elephant',
              'giraffe',
              'gorilla',
              'hippo',
              'hyena',
              'kob',
              'kudu',
              'lechwe',
              'leopard',
              'lion',
              'redriverhog',
              'rhino',
              'sable',
              'shoebill',
              'topi',
              'tsessebe',
              'warthog',
              'waterbuck',
              'wildebeest',
              'wilddog',
              'zebra',
              'other'
            ],
            enumNames: [
              'Bongo',
              'Buffalo',
              'Cheetah',
              'Chimpanzee',
              'Crocodile',
              'Eland',
              'Elephant',
              'Giraffe',
              'Gorilla',
              'Hippo',
              'Hyena',
              'Kob',
              'Kudu',
              'Lechwe',
              'Leopard',
              'Lion',
              'Red River Hog',
              'Rhino',
              'Sable',
              'Shoebill',
              'Topi',
              'Tsessebe',
              'Warthog',
              'Waterbuck',
              'Wildebeest',
              'Wild Dog',
              'Zebra',
              'Other'
            ],
            key: 'wildlifesightingrep_species'
          },
          wildlifesightingrep_numberanimals: {
            type: 'number',
            title: 'Count',
            minimum: 0,
            key: 'wildlifesightingrep_numberanimals'
          },
          wildlifesightingrep_collared: {
            type: 'string',
            title: 'Are Animals Collared',
            enum: [
              'yes',
              'no'
            ],
            enumNames: [
              'Yes',
              'No'
            ],
            key: 'wildlifesightingrep_collared'
          }
        },
        id: 'https://era-7995.pamdas.org/api/v1.0/activity/events/schema/eventtype/wildlife_sighting_rep',
        icon_id: 'wildlife_sighting_rep',
        image_url: 'https://era-7995.pamdas.org/static/wildlife_sighting-black.svg',
        required: []
      },
      uiSchema: {
        details: {
          'ui:widget': 'textarea'
        },
        Details: {
          'ui:widget': 'textarea'
        },
        wildlifesightingrep_species: {
          classNames: ' col-lg-6'
        },
        wildlifesightingrep_numberanimals: {
          classNames: ' col-lg-6'
        },
        wildlifesightingrep_collared: {
          classNames: ' col-lg-6'
        },
        'ui:groups': [
          {
            origin: 'inferred',
            items: [
              'wildlifesightingrep_species',
              'wildlifesightingrep_numberanimals',
              'wildlifesightingrep_collared'
            ]
          }
        ]
      }
    }
  },
  accident_rep: {
    base: {
      definition: [
        {
          key: 'type_accident',
          htmlClass: 'col-lg-6'
        },
        {
          key: 'number_people_involved',
          htmlClass: 'col-lg-6'
        },
        {
          key: 'animals_involved',
          htmlClass: 'col-lg-6'
        }
      ],
      schema: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        title: 'EventType Test Data',
        type: 'object',
        properties: {
          type_accident: {
            type: 'string',
            title: 'Type of accident',
            key: 'type_accident'
          },
          number_people_involved: {
            type: 'number',
            title: 'Number of people involved',
            minimum: 0,
            key: 'number_people_involved'
          },
          animals_involved: {
            type: 'string',
            title: 'Animals involved',
            key: 'animals_involved'
          }
        },
        id: 'https://era-7995.pamdas.org/api/v1.0/activity/events/schema/eventtype/accident_rep',
        icon_id: 'accident_rep',
        image_url: 'https://era-7995.pamdas.org/static/accident-black.svg',
        required: []
      },
      uiSchema: {
        details: {
          'ui:widget': 'textarea'
        },
        Details: {
          'ui:widget': 'textarea'
        },
        type_accident: {
          classNames: ' col-lg-6'
        },
        number_people_involved: {
          classNames: ' col-lg-6'
        },
        animals_involved: {
          classNames: ' col-lg-6'
        },
        'ui:groups': [
          {
            origin: 'inferred',
            items: [
              'type_accident',
              'number_people_involved',
              'animals_involved'
            ]
          }
        ]
      }
    }
  }
};
