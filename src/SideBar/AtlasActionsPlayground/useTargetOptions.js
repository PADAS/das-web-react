import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

import { calcTitleAndSubtitle } from '../../utils/titles';
import { calcTitleAndSubtitleForPatrol } from '../../utils/patrols';
import { canShowTrackForSubject, getUniqueSubjectGroupSubjects } from '../../utils/subjects';
import { eventTypeTitleForEvent } from '../../utils/events';
import { EVENTS_API_URL } from '../../ducks/events';
import { getAnalyzerListState } from '../MapLayersTab/AnalyzersTab/selectors';
import { getFeatureLayerListState } from '../MapLayersTab/FeaturesTab/selectors';
import { PATROLS_API_URL } from '../../ducks/patrols';
import { selectHydratedSubjectGroupsWithLastPositionTime } from '../../selectors/subjects';

const RECENT_PAGE_SIZE = 50;

const byLabel = (a, b) => a.label.localeCompare(b.label);

const flattenSubjectGroups = (subjectGroups, depth = 0) => subjectGroups.flatMap((subjectGroup) => [
  { id: subjectGroup.id, label: `${'  '.repeat(depth)}${subjectGroup.name}` },
  ...flattenSubjectGroups(subjectGroup.subgroups, depth + 1),
]);

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

const EVENT_PARAMS = { include_notes: false, include_related_events: false, sort_by: '-updated_at' };
const PATROL_PARAMS = {};

// What each action can act on, read from the site as the user sees it.
const useTargetOptions = () => {
  const eventTypes = useSelector((state) => state.data.eventTypes);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);
  const subjectGroups = useSelector(selectHydratedSubjectGroupsWithLastPositionTime);
  const featureSets = useSelector(getFeatureLayerListState);
  const analyzerList = useSelector(getAnalyzerListState);

  const recentEvents = useRecent(EVENTS_API_URL, EVENT_PARAMS);
  const recentPatrols = useRecent(PATROLS_API_URL, PATROL_PARAMS);

  return useMemo(() => {
    const subjects = getUniqueSubjectGroupSubjects(...subjectGroups);

    return {
      analyzers: analyzerList[0].features.map((analyzer) => ({ id: analyzer.id, label: analyzer.name })).sort(byLabel),
      events: {
        ...recentEvents,
        options: recentEvents.results.map((event) => ({
          id: event.id,
          label: `#${event.serial_number} · ${calcTitleAndSubtitle(event.title, eventTypeTitleForEvent(event, eventTypes)).title || event.event_type} · ${event.state}`,
        })),
      },
      eventTypes: eventTypes
        .filter((eventType) => eventType.is_active !== false)
        .map((eventType) => ({ id: eventType.id, label: eventType.display }))
        .sort(byLabel),
      featureSets: featureSets.map((featureSet) => ({ id: featureSet.id, label: featureSet.name })).sort(byLabel),
      patrols: {
        ...recentPatrols,
        options: recentPatrols.results.map((patrol) => ({
          id: patrol.id,
          label: `#${patrol.serial_number} · ${calcTitleAndSubtitleForPatrol(patrol, patrolTypes).title} · ${patrol.state}`,
        })),
      },
      patrolTypes: patrolTypes
        .filter((patrolType) => patrolType.is_active !== false)
        .map((patrolType) => ({ id: patrolType.id, label: patrolType.display }))
        .sort(byLabel),
      subjectGroups: flattenSubjectGroups(subjectGroups),
      // Atlas drafts only v2 event types.
      v2EventTypes: {
        error: false,
        isLoading: false,
        options: eventTypes
          .filter((eventType) => eventType.version === 2 && eventType.is_active !== false && !eventType.is_collection)
          .map((eventType) => ({ id: eventType.id, label: eventType.display }))
          .sort(byLabel),
      },
      subjects: subjects.map((subject) => ({ id: subject.id, label: subject.name })).sort(byLabel),
      trackableSubjects: subjects
        .filter(canShowTrackForSubject)
        .map((subject) => ({ id: subject.id, label: subject.name }))
        .sort(byLabel),
    };
  }, [analyzerList, eventTypes, featureSets, patrolTypes, recentEvents, recentPatrols, subjectGroups]);
};

export default useTargetOptions;
