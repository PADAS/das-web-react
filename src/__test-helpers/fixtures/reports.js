export const report = {
  id: 'd45cb504-4612-41fe-9ea5-f1b423ac3ba4',
  location: {
    latitude: '20.75709101172957',
    longitude: '-104.19557197413907'
  },
  time: '2022-04-01T10:28:40.677000-07:00',
  end_time: null,
  serial_number: 165634,
  message: '',
  provenance: '',
  event_type: 'light_rep',
  priority: 300,
  priority_label: 'Red',
  attributes: {},
  comment: null,
  title: null,
  notes: [],
  reported_by: null,
  state: 'new',
  event_details: {},
  contains: [],
  is_linked_to: [],
  is_contained_in: [],
  files: [],
  related_subjects: [],
  sort_at: '2022-04-01T10:28:50.431028-07:00',
  patrol_segments: [],
  updated_at: '2022-04-01T10:28:50.431028-07:00',
  created_at: '2022-04-01T10:28:50.432035-07:00',
  icon_id: 'light_rep',
  event_category: 'security',
  url: 'https://develop.pamdas.org/api/v1.0/activity/event/d45cb504-4612-41fe-9ea5-f1b423ac3ba4',
  image_url: 'https://develop.pamdas.org/static/sprite-src/light_rep.svg',
  geojson: {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [
        -104.19557197413907,
        20.75709101172957
      ]
    },
    properties: {
      message: '',
      datetime: '2022-04-01T17:28:40.677000+00:00',
      image: 'https://develop.pamdas.org/static/sprite-src/light_rep.svg',
      icon: {
        iconUrl: 'https://develop.pamdas.org/static/sprite-src/light_rep.svg',
        iconSize: [
          25,
          25
        ],
        iconAncor: [
          12,
          12
        ],
        popupAncor: [
          0,
          -13
        ],
        className: 'dot'
      }
    }
  },
  is_collection: false,
  updates: [
    {
      message: 'Added',
      time: '2022-04-01T17:28:50.439612+00:00',
      user: {
        username: 'yazzm',
        first_name: 'Yazz',
        last_name: '',
        id: '4d4363e1-16d0-499b-856a-f8846ac23938',
        content_type: 'accounts.user'
      },
      type: 'add_event'
    }
  ],
  patrols: []
};

export const files = [{
  created_at: '2022-06-06T14:58:48.242658-07:00',
  filename: 'file1.pdf',
  id: 'b1a3951e-20b7-4516-b0a2-df6f3e4bde17',
  updated_at: '2022-06-06T14:58:48.242658-07:00',
  updates: [{ time: '2022-06-06T21:58:48.248635+00:00' }],
  url: 'https://das-7915.pamdas.org/api/v1.0/activity/event/001d3e8e-acc6-43e4-877b-21126b50050e/file/b1a3951e-20b7-4516-b0a2-df6f3e4bde17/',
}, {
  created_at: '2022-06-07T14:58:48.242658-07:00',
  filename: 'file2.pdf',
  id: 'b1a3951e-20b7-4516-b0a2-df6f3e4bde18',
  updated_at: '2022-06-07T14:58:48.242658-07:00',
  updates: [{ time: '2022-06-07T21:58:48.248635+00:00' }],
  url: 'https://das-7915.pamdas.org/api/v1.0/activity/event/001d3e8e-acc6-43e4-877b-21126b50050e/file/b1a3951e-20b7-4516-b0a2-df6f3e4bde18/',
}];

export const notes = [{
  text: 'note3',
  id: 'b1a3951e-20b7-4516-b0a2-df6f3e4bde19',
  updates: [{ time: '2022-06-08T21:58:48.248635+00:00' }],
}, {
  text: 'note4',
  id: 'b1a3951e-20b7-4516-b0a2-df6f3e4bde20',
  updates: [{ time: '2022-06-09T21:58:48.248635+00:00' }],
}];
