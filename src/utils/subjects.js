import uniqBy from 'lodash/uniqBy';
import { differenceInSeconds } from 'date-fns';

const STATIONARY_RADIO_SUBTYPES = ['stationary-radio'];
const MOBILE_RADIO_SUBTYPES = ['ranger'];
const RADIO_SUBTYPES = [...STATIONARY_RADIO_SUBTYPES, ...MOBILE_RADIO_SUBTYPES];
const RECENT_RADIO_DECAY_THRESHOLD = 30 * 60; // 30 minutes
const NUMBER_OF_RECENT_RADIOS_TO_DISPLAY = 5;

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

export const calcRecentRadiosFromSubjects = (...subjects) => subjects
.filter(subjectIsARadio)
.filter((subject) => {
  const elapsedSeconds = calcElapsedTimeSinceSubjectRadioActivity(subject);
  return (elapsedSeconds >= 0) && (elapsedSeconds < RECENT_RADIO_DECAY_THRESHOLD);
})
.sort((a, b) => calcElapsedTimeSinceSubjectRadioActivity(a) - calcElapsedTimeSinceSubjectRadioActivity(b))
.splice(0, NUMBER_OF_RECENT_RADIOS_TO_DISPLAY);

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

export const getSubjectLastPositionCoordinates = subject => subject.last_position ? subject.last_position.geometry.coordinates : subject.geometry ?  subject.geometry.coordinates : null;

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
}