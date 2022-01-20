import React, { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { hideSubjects, showSubjects } from '../ducks/map-ui';
import { getUniqueSubjectGroupSubjects, filterSubjects } from '../utils/subjects';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';
import { getSubjectGroups } from '../selectors/subjects';
import CheckableList from '../CheckableList';

import Content from './Content';
import listStyles from '../SideBar/styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const SubjectGroupList = (props) => {
  const { subjectGroups: groups, mapLayerFilter, hideSubjects, showSubjects, hiddenSubjectIDs, map } = props;

  const searchText = useMemo(() => mapLayerFilter.filter.text || '', [mapLayerFilter.filter.text]);

  const subjectFilterEnabled = searchText.length > 0;
  const subjectGroups = [...groups, ...[{
    'name': 'Statics Group',
    'id': '4ed66da2-a79b-4ad9-8dc6-45838c3d8baa',
    'subgroups': [],
    'subjects': [
      {
        'content_type': 'observations.subject',
        'id': '8e41f084-e62b-4475-9de0-e621d3940aaa',
        'name': 'Water tank',
        'subject_type': 'static_sensor',
        'subject_subtype': 'static sensor',
        'common_name': null,
        'additional': {
          'rgb': '39, 98, 196',
          'sex': 'female',
          'alive': true,
          'extra': 'EXTRA',
          'region': '',
          'country': '',
          'tm_animal_id': ''
        },
        'created_at': '2020-08-20T22:08:07.272822-07:00',
        'updated_at': '2021-10-20T15:24:19.840297-07:00',
        'is_active': true,
        'is_static': true,
        'region': '',
        'country': '',
        'sex': 'female',
        'tracks_available': true,
        'image_url': '/static/ranger-black.svg',
        'last_position_status': {
          'last_voice_call_start_at': null,
          'radio_state_at': '2020-10-30T00:06:44+00:00',
          'radio_state': 'roam app state'
        },
        'last_position_date': '2020-10-30T00:06:42+00:00',
        'last_position': {
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [
              -122.35966866,
              47.68613694
            ]
          },
          'properties': {
            'is_static': true,
            'title': 'Water tank',
            'subject_type': 'static_sensor',
            'subject_subtype': 'static_sensor',
            'id': '8e41f084-e62b-4475-9de0-e621d3940aaa',
            'stroke': '#2762C4',
            'stroke-opacity': 1,
            'stroke-width': 2,
            'image': 'https://develop.pamdas.org/static/static-water-tank.svg',
            'last_voice_call_start_at': null,
            'location_requested_at': null,
            'radio_state_at': '2020-10-30T00:06:44+00:00',
            'radio_state': 'roam app state',
            'coordinateProperties': {
              'time': '2020-10-30T00:06:42+00:00'
            },
            'DateTime': '2020-10-30T00:06:42+00:00'
          }
        },
        'device_status_properties': [{ default: true, label: 'Level', units: 'lts', value: '5', }, { default: false, label: 'Wind', units: 'kph', value: '12', }, { label: 'Humidity', units: '%', value: '75', }],
        'url': 'https://develop.pamdas.org/api/v1.0/subject/8e41f084-e62b-4475-9de0-e621d394019d'
      }, {
        'content_type': 'observations.subject',
        'id': '8e41f084-e62b-4475-9de0-e621d3940bbb',
        'name': 'Weather big big name for subject',
        'subject_type': 'static_sensor',
        'subject_subtype': 'static_sensor',
        'common_name': null,
        'additional': {
          'rgb': '39, 98, 196',
          'sex': 'female',
          'alive': true,
          'extra': 'EXTRA',
          'region': '',
          'country': '',
          'tm_animal_id': ''
        },
        'created_at': '2020-08-20T22:08:07.272822-07:00',
        'updated_at': '2021-10-20T15:24:19.840297-07:00',
        'is_active': true,
        'is_static': true,
        'region': '',
        'country': '',
        'sex': 'female',
        'tracks_available': true,
        'image_url': '/static/ranger-black.svg',
        'last_position_status': {
          'last_voice_call_start_at': null,
          'radio_state_at': '2020-10-30T00:06:44+00:00',
          'radio_state': 'roam app state'
        },
        'last_position_date': '2020-10-30T00:06:42+00:00',
        'last_position': {
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [
              -122.35966866,
              47.68613694
            ]
          },
          'properties': {
            'is_static': true,
            'title': 'Weather big big name for subject',
            'subject_type': 'static_sensor',
            'subject_subtype': 'static_sensor',
            'id': '8e41f084-e62b-4475-9de0-e621d3940bbb',
            'stroke': '#2762C4',
            'stroke-opacity': 1,
            'stroke-width': 2,
            'image': 'https://develop.pamdas.org/static/static-weather.svg',
            'last_voice_call_start_at': null,
            'location_requested_at': null,
            'radio_state_at': '2020-10-30T00:06:44+00:00',
            'radio_state': 'roam app state',
            'coordinateProperties': {
              'time': '2021-12-10T16:50:08+00:00'
            },
            'DateTime': '2021-12-10T16:50:08+00:00',
          }
        },
        'device_status_properties': [{ default: true, label: 'Temperature', units: 'ºC', value: '31', }, { label: 'Wind', units: 'kph', value: '12', }, { label: 'Humidity', units: '%', value: '75', }],
        'url': 'https://develop.pamdas.org/api/v1.0/subject/8e41f084-e62b-4475-9de0-e621d394019d'
      }, {
        'content_type': 'observations.subject',
        'id': '30112db4-1aaf-4deb-98e5-0fa7eb46eb5b',
        'name': '206214702120621470212062147021',
        'subject_type': 'person',
        'subject_subtype': 'ranger',
        'common_name': null,
        'additional': {},
        'created_at': '2021-05-18T13:53:30.472910-07:00',
        'updated_at': '2021-09-08T23:59:22.709722-07:00',
        'is_active': true,
        'tracks_available': false,
        'image_url': '/static/ranger-black.svg',
        'last_position_status': {
          'last_voice_call_start_at': null,
          'radio_state_at': null,
          'radio_state': 'na'
        },
        'device_status_properties': [{ default: false, label: 'Temperature', units: 'ºC', value: '31', }, { label: 'Wind', units: 'kph', value: '12', }, { default: true, label: 'Humidity', units: '%', value: '75', }],
        'url': 'https://develop.pamdas.org/api/v1.0/subject/30112db4-1aaf-4deb-98e5-0fa7eb46eb5b',
        'messaging': [
          {
            'source_provider': 'inReach Push',
            'url': 'https://develop.pamdas.org/api/v1.0/messages?subject_id=30112db4-1aaf-4deb-98e5-0fa7eb46eb5b&source_id=fe3cb18a-d97e-4471-ba89-5f6fc76389c7'
          }
        ]
      }, {
        'content_type': 'observations.subject',
        'id': 'dba0e0a6-0083-41be-a0eb-99e956977748',
        'name': 'Alex',
        'subject_type': 'person',
        'subject_subtype': 'ranger',
        'common_name': null,
        'additional': {},
        'created_at': '2021-08-31T14:42:06.701541-07:00',
        'updated_at': '2021-08-31T14:42:06.701557-07:00',
        'is_active': true,
        'tracks_available': true,
        'image_url': '/static/ranger-black.svg',
        'last_position_status': {
          'last_voice_call_start_at': null,
          'radio_state_at': '2021-09-29T23:08:44+00:00',
          'radio_state': 'roam app state'
        },
        'last_position_date': '2021-09-29T23:08:44+00:00',
        'last_position': {
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [
              -99.19257666666665,
              19.57545333333333
            ]
          },
          'properties': {
            'title': 'Alex',
            'subject_type': 'person',
            'subject_subtype': 'ranger',
            'id': 'dba0e0a6-0083-41be-a0eb-99e956977748',
            'stroke': '#FFFF00',
            'stroke-opacity': 1,
            'stroke-width': 2,
            'image': 'https://develop.pamdas.org/static/ranger-black.svg',
            'last_voice_call_start_at': null,
            'location_requested_at': null,
            'radio_state_at': '2021-09-29T23:08:44+00:00',
            'radio_state': 'roam app state',
            'coordinateProperties': {
              'time': '2021-09-29T23:08:44+00:00'
            },
            'DateTime': '2021-09-29T23:08:44+00:00'
          }
        },
        'device_status_properties': [
          {
            'label': 'Last telemetry event',
            'units': '',
            'value': 'roam app action'
          },
          {
            default: true,
            'label': 'radio_state_at',
            'units': 'utc',
            'value': '2021-09-29T23:08:44Z'
          },
          {
            'label': 'radio_state',
            'units': 'on/offline',
            'value': 'roam app state'
          }
        ],
        'url': 'https://develop.pamdas.org/api/v1.0/subject/dba0e0a6-0083-41be-a0eb-99e956977748'
      }, {
        'content_type': 'observations.subject',
        'id': '92ad9eff-b3bd-4f0b-9d4a-cc149506480f',
        'name': 'AD-XF39G',
        'subject_type': 'person',
        'subject_subtype': 'ranger',
        'common_name': null,
        'additional': {},
        'created_at': '2020-11-23T16:23:06.784959-08:00',
        'updated_at': '2020-11-23T16:23:06.784979-08:00',
        'is_active': true,
        'tracks_available': true,
        'image_url': '/static/ranger-green.svg',
        'last_position_status': {
          'last_voice_call_start_at': '2020-11-24T00:31:14+00:00',
          'radio_state_at': '2020-11-24T00:31:44+00:00',
          'radio_state': 'online-gps'
        },
        'last_position_date': '2020-11-24T00:31:44+00:00',
        'last_position': {
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [
              38.73654475196881,
              8.985882578546438
            ]
          },
          'properties': {
            'title': 'AD-XF39G',
            'subject_type': 'person',
            'subject_subtype': 'ranger',
            'id': '92ad9eff-b3bd-4f0b-9d4a-cc149506480f',
            'stroke': '#FFFF00',
            'stroke-opacity': 1,
            'stroke-width': 2,
            'image': 'https://develop.pamdas.org/static/ranger-green.svg',
            'last_voice_call_start_at': '2020-11-24T00:31:14+00:00',
            'location_requested_at': null,
            'radio_state_at': '2020-11-24T00:31:44+00:00',
            'radio_state': 'online-gps',
            'coordinateProperties': {
              'time': '2020-11-24T00:31:44+00:00'
            },
            'DateTime': '2020-11-24T00:31:44+00:00'
          }
        },
        'device_status_properties': [
          {
            default: true,
            'label': 'Status',
            'units': 'now',
            'value': 'online-gps'
          }
        ],
        'url': 'https://develop.pamdas.org/api/v1.0/subject/92ad9eff-b3bd-4f0b-9d4a-cc149506480f'
      }
    ]
  }]];

  const subjectFilterIsMatch = useCallback((subject) => {
    if (searchText.length === 0) return true;
    return (subject.name.toLowerCase().includes(searchText));
  }, [searchText]);

  const groupsInList = useMemo(() => {
    return subjectFilterEnabled ?
      filterSubjects(subjectGroups, subjectFilterIsMatch) :
      subjectGroups.filter(g => !!g.subgroups.length || !!g.subjects.length);
  }, [subjectFilterEnabled, subjectFilterIsMatch, subjectGroups]);

  const groupIsFullyVisible = group => !getUniqueSubjectGroupSubjects(group).map(item => item.id).some(id => hiddenSubjectIDs.includes(id));
  const groupIsPartiallyVisible = (group) => {
    const groupSubjectIDs = getUniqueSubjectGroupSubjects(group).map(item => item.id);
    return !groupIsFullyVisible(group, hiddenSubjectIDs) && !groupSubjectIDs.every(id => hiddenSubjectIDs.includes(id));
  };

  const onSubjectCheckClick = (subject) => {
    if (subjectIsVisible(subject)) return hideSubjects(subject.id);
    return showSubjects(subject.id);
  };

  const subjectIsVisible = subject => !hiddenSubjectIDs.includes(subject.id);

  const onGroupCheckClick = (group) => {
    const subjectIDs = getUniqueSubjectGroupSubjects(group).map(s => s.id);
    if (groupIsFullyVisible(group)) {
      mapLayerTracker.track('Uncheck Group Map Layer checkbox', `Group:${group.name}`);
      return hideSubjects(...subjectIDs);
    } else {
      mapLayerTracker.track('Check Group Map Layer checkbox', `Group:${group.name}`);
      return showSubjects(...subjectIDs);
    }
  };

  const listLevel = 0;

  const itemProps = {
    map,
    onGroupCheckClick,
    onSubjectCheckClick,
    hiddenSubjectIDs,
    subjectIsVisible,
    subjectFilterEnabled,
    subjectFilterIsMatch,
    listLevel,
  };

  return !!groupsInList.length && <CheckableList
    className={listStyles.list}
    id='subjectgroups'
    onCheckClick={onGroupCheckClick}
    itemComponent={Content}
    itemProps={itemProps}
    items={groupsInList}
    itemFullyChecked={groupIsFullyVisible}
    itemPartiallyChecked={groupIsPartiallyVisible} />;
};

const mapStateToProps = (state) => {
  const { data: { mapLayerFilter }, view: { hiddenSubjectIDs } } = state;
  return { subjectGroups: getSubjectGroups(state), mapLayerFilter, hiddenSubjectIDs };
};

export default connect(mapStateToProps, { hideSubjects, showSubjects })(memo(SubjectGroupList));

SubjectGroupList.defaultProps = {
  map: {},
};

SubjectGroupList.propTypes = {
  map: PropTypes.object,
};
