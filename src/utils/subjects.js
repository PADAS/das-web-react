import uniqBy from 'lodash/uniqBy';
import differenceInSeconds from 'date-fns/difference_in_seconds';

import { findTimeEnvelopeIndices } from './tracks';
import { getActivePatrolsForLeaderId } from './patrols';


const STATIONARY_SUBJECT_TYPE = 'stationary-object';
const STATIONARY_RADIO_SUBTYPES = ['stationary-radio'];
const MOBILE_RADIO_SUBTYPES = ['ranger'];
const RADIO_SUBTYPES = [...STATIONARY_RADIO_SUBTYPES, ...MOBILE_RADIO_SUBTYPES];
export const RECENT_RADIO_DECAY_THRESHOLD = (30 * 60); // 30 minutes

export const subjectIsARadio = subject => RADIO_SUBTYPES.includes(subject.subject_subtype);
export const subjectIsAFixedPositionRadio = subject => STATIONARY_RADIO_SUBTYPES.includes(subject.subject_subtype);
export const subjectIsAMobileRadio = subject => MOBILE_RADIO_SUBTYPES.includes(subject.subject_subtype);

export const subjectIsARadioWithRecentVoiceActivity = (properties) => {
  return subjectIsARadio(properties)
    && !!properties.last_voice_call_start_at
    && properties.last_voice_call_start_at !== 'null'; /* extra check for bad deserialization from mapbox-held subject data */
};

export const isRadioWithImage = (subject) => subjectIsARadio(subject) && !!subject.last_position && !!subject.last_position.properties && subject.last_position.properties.image;

const calcElapsedTimeSinceSubjectRadioActivity = (subject) => {
  if (subject
    && subject.last_position_status
    && subject.last_position_status.last_voice_call_start_at) {
    const updatedTime = new Date(subject.last_position_status.last_voice_call_start_at);
    if (updatedTime) {
      const delta = differenceInSeconds(new Date(), updatedTime);
      if (delta > 0) {
        return delta;
      }
    }
  }
  return -1;
};

export const radioHasRecentActivity = (radio) => {
  const elapsedSeconds = calcElapsedTimeSinceSubjectRadioActivity(radio);

  return (elapsedSeconds >= 0) && (elapsedSeconds < RECENT_RADIO_DECAY_THRESHOLD);
};

export const calcRecentRadiosFromSubjects = (...subjects) => {
  const recentRadios = subjects
    .filter(subjectIsARadio)
    .filter(radioHasRecentActivity)
    .sort((a, b) => calcElapsedTimeSinceSubjectRadioActivity(a) - calcElapsedTimeSinceSubjectRadioActivity(b));

  return recentRadios;
};

export const getSubjectGroupSubjects = (...groups) => groups.reduce((accumulator, group) => {
  if (group.subjects && group.subjects.length) {
    accumulator.push(...group.subjects);
  }
  if (group.subgroups && group.subgroups.length) {
    accumulator.push(...getSubjectGroupSubjects(...group.subgroups));
  }
  return accumulator;
}, []);

export const getUniqueSubjectGroupSubjects = (...groups) => uniqBy(getSubjectGroupSubjects(...groups), 'id');

export const getUniqueSubjectGroupSubjectIDs = (...groups) => getUniqueSubjectGroupSubjects(...groups).map(subject => subject.id);

export const subjectIsStatic = subject => {
  return subject?.is_static ?? subject?.properties?.is_static ?? subject.last_position?.properties?.is_static ??
  subject?.subject_type === STATIONARY_SUBJECT_TYPE ?? subject?.properties?.subject_type === STATIONARY_SUBJECT_TYPE;
};

export const canShowTrackForSubject = subject =>
  subject.tracks_available
  && !subjectIsAFixedPositionRadio(subject);


export const getHeatmapEligibleSubjectsFromGroups = (...groups) => getUniqueSubjectGroupSubjects(...groups)
  .filter(canShowTrackForSubject);

export const getSubjectLastPositionCoordinates = subject => {
  return subject.last_position && subject.last_position.geometry ? subject.last_position.geometry.coordinates
    : subject.geometry ? subject.geometry.coordinates : null;
};

export const getSubjectDefaultDeviceProperty = subject => {
  const deviceStatusProperties = subject?.properties?.device_status_properties ?? subject?.device_status_properties ?? [];
  return deviceStatusProperties.find(deviceProperty => deviceProperty?.default ?? false) ?? {};
};

export const updateSubjectLastPositionFromSocketStatusUpdate = (subject, updateObj) => {
  const update = { ...updateObj };

  delete update.trace_id;
  delete update.mid;

  const returnVal = {
    ...subject,
    last_position_date: update.properties.coordinateProperties.time,
    last_position_status: {
      ...subject.last_position_status,
      last_voice_call_start_at: update.properties.last_voice_call_start_at,
      radio_state_at: update.properties.radio_state_at,
      radio_state: update.properties.state || subject.last_position.radio_state,
    },
    last_position: {
      ...subject.last_position, ...update, properties: {
        ...subject.last_position.properties,
        ...update.properties,
        radio_state: update.properties.state || subject.last_position.radio_state, // API incongruency band-aid :(
      }
    },
    device_status_properties: {
      ...subject?.device_status_properties,
      ...updateObj?.device_status_properties
    }
  };

  if (update.hasOwnProperty('device_status_properties')) {
    returnVal.device_status_properties = update.device_status_properties;
  }

  return returnVal;
};

export const pinMapSubjectsToVirtualPosition = (mapSubjectFeatureCollection, tracks, virtualDate) => {
  return {
    ...mapSubjectFeatureCollection,
    features: mapSubjectFeatureCollection.features
      .map((feature) => {
        const trackMatch = tracks[feature.properties.id];

        if (!trackMatch) return feature;

        const [trackFeature] = trackMatch.track.features;

        // this guard clause is a bit overboard because we're potentially querying very old/quirky track data.
        if (!trackFeature || !trackFeature.geometry || !trackFeature.geometry.coordinates || !trackFeature.geometry.coordinates.length) {
          return feature;
        }

        const { properties: { coordinateProperties: { times } } } = trackFeature;
        const { until } = findTimeEnvelopeIndices(times, null, virtualDate);

        const hasUntil = until > -1;

        let index = 0;

        if (hasUntil) {
          if (until === times.length) {
            index = until - 1;
          } else {
            index = until;
          }
        }

        return {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: trackFeature.geometry.coordinates[index] || feature.geometry.coordinates,
          },
          properties: {
            ...feature.properties,
            coordinateProperties: {
              ...feature.properties.coordinateProperties,
              time: trackFeature.properties.coordinateProperties.times[index] || feature.properties.coordinateProperties.time,
            }
          }
        };
      }),
  };
};

/**
 * filterSubjects is a function to drill down a given subject group array tree 
 * to filter for subjects matching the search filter as given by the function 
 * isMatch. 
 * @param {Object} s a subject groups array. 
 * @param {function} isMatch function to check if subject matches the filter.
 */
export const filterSubjects = (s, isMatch) => {
  // call recursive helper function and then filter out empty subject groups.
  return s
    .map(sg => filterSubjectsHelper(sg, isMatch))
    .filter(sg => !!sg.subgroups.length || !!sg.subjects.length);
};

/**
 * filterSubjectsHelper is a recursive function to drill down a given subject group 
 * array tree to filter for subjects matching the search filter as given by the 
 * function isMatch. 
 * NOTE that subject groups have both a subgroups and subjects array.
 * @param {Object} s either a subject group or subgroup. 
 * @param {function} isMatch function to check if subject matches the filter.
 */
const filterSubjectsHelper = (s, isMatch) => {
  let newS = [];
  if (s.subjects) { // filter the subjects array:
    newS = { ...s, subjects: s.subjects.filter(isMatch) };
  }
  if (s.subgroups) { // filter subgroups array:
    newS = {
      ...newS,
      subgroups: newS.subgroups
        .map(sg => filterSubjectsHelper(sg, isMatch))
        .filter(sg => !!sg.subjects.length || !!sg.subgroups.length)
    };
  }
  return newS;
};

export const markSubjectFeaturesWithActivePatrols = mapSubjects => ({
  ...mapSubjects,
  features: mapSubjects.features
    .map(feature => {
      feature.properties.ticker = !!(getActivePatrolsForLeaderId(feature.properties.id).length) ? 'P' : '';
      return feature;
    })
});