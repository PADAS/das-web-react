import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

import { calcTitleAndSubtitle } from '../../utils/titles';
import { calcTitleAndSubtitleForPatrol } from '../../utils/patrols';
import { canShowTrackForSubject } from '../../utils/subjects';
import { eventTypeTitleForEvent } from '../../utils/events';
import { EVENTS_API_URL } from '../../ducks/events';
import { getAnalyzerListState } from '../MapLayersTab/AnalyzersTab/selectors';
import { getFeatureLayerListState } from '../MapLayersTab/FeaturesTab/selectors';
import { getGlobalSchemaReportedBy } from '../../selectors';
import { PATROLS_API_URL } from '../../ducks/patrols';
import { selectHydratedSubjectGroupsWithLastPositionTime } from '../../selectors/subjects';

const RECENT_PAGE_SIZE = 50;

const EVENT_PARAMS = { include_notes: false, include_related_events: false, sort_by: '-updated_at' };
const PATROL_PARAMS = {};

const byLabel = (a, b) => a.label.localeCompare(b.label);

const loaded = (options) => ({ error: false, isLoading: false, options });

const flattenSubjectGroups = (subjectGroups, depth = 0) => subjectGroups.flatMap((subjectGroup) => [
  { id: subjectGroup.id, label: `${'  '.repeat(depth)}${subjectGroup.name}` },
  ...flattenSubjectGroups(subjectGroup.subgroups, depth + 1),
]);

// A subject belongs to its group and to every group above it.
const collectSubjects = (subjectGroups, ancestorIds = [], subjectsById = {}) => {
  subjectGroups.forEach((subjectGroup) => {
    const groupIds = [...ancestorIds, subjectGroup.id];
    subjectGroup.subjects.forEach((subject) => {
      const entry = subjectsById[subject.id] ?? { groupIds: new Set(), subject };
      groupIds.forEach((groupId) => entry.groupIds.add(groupId));
      subjectsById[subject.id] = entry;
    });
    collectSubjects(subjectGroup.subgroups, groupIds, subjectsById);
  });

  return subjectsById;
};

const reporterLabel = (reporter) => reporter.name
  || `${reporter.first_name ?? ''} ${reporter.last_name ?? ''}`.trim()
  || reporter.username;

const useRecent = (url, params) => {
  const [recent, setRecent] = useState({ error: false, isLoading: true, results: [] });

  useEffect(() => {
    const controller = new AbortController();

    axios.get(url, { params: { page_size: RECENT_PAGE_SIZE, ...params }, signal: controller.signal })
      .then((response) => setRecent({ error: false, isLoading: false, results: response.data.data.results }))
      .catch((error) => {
        if (!axios.isCancel(error)) setRecent({ error: true, isLoading: false, results: [] });
      });

    return () => controller.abort();
  }, [params, url]);

  return recent;
};

// The site data a spec's "x-source" names, as the user sees it. An option's
// "parents" lists, per source, the items it belongs to, which "x-within" uses
// to narrow it.
const useSources = () => {
  const analyzerList = useSelector(getAnalyzerListState);
  const eventTypes = useSelector((state) => state.data.eventTypes);
  const featureSets = useSelector(getFeatureLayerListState);
  const patrolMembers = useSelector((state) => state.data.patrolTeamAndTrackingOptions?.members);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);
  const reporters = useSelector(getGlobalSchemaReportedBy);
  const subjectGroups = useSelector(selectHydratedSubjectGroupsWithLastPositionTime);

  const recentEvents = useRecent(EVENTS_API_URL, EVENT_PARAMS);
  const recentPatrols = useRecent(PATROLS_API_URL, PATROL_PARAMS);

  return useMemo(() => {
    const subjects = Object.values(collectSubjects(subjectGroups))
      .map(({ groupIds, subject }) => ({
        id: subject.id,
        label: subject.name,
        parents: { subject_groups: [...groupIds] },
        subject,
      }))
      .sort(byLabel);
    const activeEventTypes = eventTypes.filter((eventType) => eventType.is_active !== false);

    return {
      analyzers: loaded(analyzerList[0].features.map((analyzer) => ({ id: analyzer.id, label: analyzer.name })).sort(byLabel)),
      event_types: loaded(activeEventTypes.map((eventType) => ({ id: eventType.id, label: eventType.display })).sort(byLabel)),
      features: loaded(featureSets
        .flatMap((featureSet) => featureSet.featuresByType.flatMap((featureType) => featureType.features.map((feature) => ({
          id: feature.id,
          label: feature.name,
          parents: { feature_sets: [featureSet.id] },
        }))))
        .sort(byLabel)),
      feature_sets: loaded(featureSets.map((featureSet) => ({ id: featureSet.id, label: featureSet.name })).sort(byLabel)),
      patrol_leaders: loaded((patrolMembers ?? []).map((member) => ({ id: member.id, label: member.name })).sort(byLabel)),
      patrol_types: loaded(patrolTypes
        .filter((patrolType) => patrolType.is_active !== false)
        .map((patrolType) => ({ id: patrolType.id, label: patrolType.display }))
        .sort(byLabel)),
      recent_events: {
        ...recentEvents,
        options: recentEvents.results.map((event) => ({
          id: event.id,
          label: `#${event.serial_number} · ${calcTitleAndSubtitle(event.title, eventTypeTitleForEvent(event, eventTypes)).title || event.event_type} · ${event.state}`,
        })),
      },
      recent_patrols: {
        ...recentPatrols,
        options: recentPatrols.results.map((patrol) => ({
          id: patrol.id,
          label: `#${patrol.serial_number} · ${calcTitleAndSubtitleForPatrol(patrol, patrolTypes).title} · ${patrol.state}`,
        })),
      },
      reporters: loaded(reporters.map((reporter) => ({ id: reporter.id, label: reporterLabel(reporter) })).sort(byLabel)),
      subject_groups: loaded(flattenSubjectGroups(subjectGroups)),
      subjects: loaded(subjects),
      trackable_subjects: loaded(subjects.filter((option) => canShowTrackForSubject(option.subject))),
      // Atlas drafts only v2 event types.
      v2_event_types: loaded(activeEventTypes
        .filter((eventType) => eventType.version === 2 && !eventType.is_collection)
        .map((eventType) => ({ id: eventType.id, label: eventType.display }))
        .sort(byLabel)),
    };
  }, [analyzerList, eventTypes, featureSets, patrolMembers, patrolTypes, recentEvents, recentPatrols, reporters, subjectGroups]);
};

export default useSources;
