import uniqBy from 'lodash/uniqBy';
import { differenceInSeconds } from 'date-fns';

const STATIONARY_RADIO_SUBTYPES = ['stationary-radio'];
const MOBILE_RADIO_SUBTYPES = ['ranger'];
const RADIO_SUBTYPES = [...STATIONARY_RADIO_SUBTYPES, ...MOBILE_RADIO_SUBTYPES];
const RECENT_RADIO_DECAY_THRESHOLD = (30 * 60); // 30 minutes

export const pinSubjectPositionToLastKnownTrackPosition = (subjects, tracks) => {
  const { features:subjectFeatures } = subjects;
  const { features:subjectTracks } = tracks;

  if (!subjectTracks.length) return subjects;
  return {
    ...subjects,
    features: subjectFeatures.map((feature) => {
      const trackMatch = subjectTracks.find(trackFeature => trackFeature.properties.id === feature.properties.id);
      if (!trackMatch) return feature;
      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: trackMatch.geometry.coordinates[0],
        },
        properties: {
          ...feature.properties,
          coordinateProperties: {
            ...feature.coordinateProperties,
            time: trackMatch.properties.coordinateProperties.times[0],
          },
        },
      };
    }),
  }
};

export const subjectIsARadio = subject => RADIO_SUBTYPES.includes(subject.subject_subtype);
export const subjectIsAFixedPositionRadio = subject => STATIONARY_RADIO_SUBTYPES.includes(subject.subject_subtype);
export const subjectIsAMobileRadio = subject => MOBILE_RADIO_SUBTYPES.includes(subject.subject_subtype);

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

export const calcRecentRadiosFromSubjects = (...subjects) => {
  const recentRadios = subjects
    .filter(subjectIsARadio)
    .filter((subject) => {
      const elapsedSeconds = calcElapsedTimeSinceSubjectRadioActivity(subject);

      return (elapsedSeconds >= 0) && (elapsedSeconds < RECENT_RADIO_DECAY_THRESHOLD);
    })
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

export const canShowTrackForSubject = subject =>
  subject.tracks_available
  && !subjectIsAFixedPositionRadio(subject);

export const getHeatmapEligibleSubjectsFromGroups = (...groups) => getUniqueSubjectGroupSubjects(...groups)
  .filter(canShowTrackForSubject);

export const getSubjectLastPositionCoordinates = subject => subject.last_position ? subject.last_position.geometry.coordinates : subject.geometry ? subject.geometry.coordinates : null;

export const updateSubjectLastPositionFromSocketStatusUpdate = (subject, update) => ({
  ...subject,
  last_position: {
    ...subject.last_position, ...update, properties: {
      ...subject.last_position.properties,
      ...update.properties,
      radio_state: update.properties.state || subject.last_position.radio_state, // API incongruency band-aid :(
    }
  },
});

export const updateSubjectsInSubjectGroupsFromSocketStatusUpdate = (subjectGroups, update) => {
  const { properties: { id } } = update;

  let cachedSubjectUpdate;

  return subjectGroups.map((group) => {
    const { subgroups, subjects } = group;
    return {
      ...group,
      subgroups: updateSubjectsInSubjectGroupsFromSocketStatusUpdate(subgroups, update),
      subjects: subjects.map((s) => {
        if (s.id === id) {
          if (!cachedSubjectUpdate) {
            cachedSubjectUpdate = updateSubjectLastPositionFromSocketStatusUpdate(s, update);
          }
          return cachedSubjectUpdate;
        }
        return s;
      }),
    };
  });
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
    newS = {...s, subjects: s.subjects.filter(isMatch)};
  }
  if (s.subgroups) { // filter subgroups array:
    newS = {
      ...newS, 
      subgroups: newS.subgroups
        .map(sg => filterSubjectsHelper(sg, isMatch))
        .filter(sg=> !!sg.subjects.length || !!sg.subgroups.length)
    };
  } 
  return newS;
};