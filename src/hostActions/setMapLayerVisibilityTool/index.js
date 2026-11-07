import {
  displayReportsOnMapState,
  hideAnalyzers,
  hideFeatures,
  hideSubjects,
  showAnalyzers,
  showFeatures,
  showSubjects,
} from '../../ducks/map-layer-filter';
import { getAnalyzerListState } from '../../SideBar/MapLayersTab/AnalyzersTab/selectors';
import { getFeatureLayerListState } from '../../SideBar/MapLayersTab/FeaturesTab/selectors';
import { getUniqueSubjectGroupSubjectIDs } from '../../utils/subjects';
import { selectHydratedSubjectGroupsWithLastPositionTime } from '../../selectors/subjects';
import { setAnalyzerFeatureActiveStateForIDs } from '../../utils/analyzers';

const UUID_LIST_SCHEMA = { items: { format: 'uuid', type: 'string' }, type: 'array' };

const findSubjectGroup = (subjectGroups, subjectGroupId) => {
  for (const subjectGroup of subjectGroups) {
    const foundSubjectGroup = subjectGroup.id === subjectGroupId
      ? subjectGroup
      : findSubjectGroup(subjectGroup.subgroups, subjectGroupId);

    if (foundSubjectGroup) return foundSubjectGroup;
  }

  return null;
};

const featureIdsForFeatureSet = (featureSet) => featureSet.featuresByType
  .flatMap((featureType) => featureType.features.map((feature) => feature.id));

const setMapLayerVisibilityTool = {
  description: 'Show or hide layers on the map, like the checkboxes in Map Layers. A subject group or a feature set '
    + 'covers everything under it, nested groups included. Ids not found are returned rather than failing the call.',
  inputSchema: {
    additionalProperties: false,
    properties: {
      analyzer_ids: { ...UUID_LIST_SCHEMA, description: 'Spatial analyzers.' },
      events_layer: { description: 'Also apply to the events shown on the map.', type: 'boolean' },
      feature_ids: { ...UUID_LIST_SCHEMA, description: 'Single spatial features.' },
      feature_set_ids: { ...UUID_LIST_SCHEMA, description: 'Feature sets ("display categories").' },
      subject_group_ids: { ...UUID_LIST_SCHEMA, description: 'Subject groups.' },
      subject_ids: { ...UUID_LIST_SCHEMA, description: 'Single subjects.' },
      visible: { description: 'true shows the layers, false hides them.', type: 'boolean' },
    },
    required: ['visible'],
    type: 'object',
  },
  name: 'set_map_layer_visibility',
  run: async (args, context) => {
    const state = context.getState();

    const subjectGroups = selectHydratedSubjectGroupsWithLastPositionTime(state);
    const foundSubjectGroups = (args.subject_group_ids ?? [])
      .map((subjectGroupId) => findSubjectGroup(subjectGroups, subjectGroupId))
      .filter((subjectGroup) => !!subjectGroup);
    const foundSubjectIds = (args.subject_ids ?? []).filter((subjectId) => !!state.data.subjectStore[subjectId]);
    const subjectIds = [...new Set([...foundSubjectIds, ...getUniqueSubjectGroupSubjectIDs(...foundSubjectGroups)])];

    const featureSets = getFeatureLayerListState(state);
    const allFeatureIds = new Set(featureSets.flatMap(featureIdsForFeatureSet));
    const foundFeatureSets = featureSets.filter((featureSet) => args.feature_set_ids?.includes(featureSet.id));
    const foundFeatureIds = (args.feature_ids ?? []).filter((featureId) => allFeatureIds.has(featureId));
    const featureIds = [...new Set([...foundFeatureIds, ...foundFeatureSets.flatMap(featureIdsForFeatureSet)])];

    const foundAnalyzers = getAnalyzerListState(state)[0].features
      .filter((analyzer) => args.analyzer_ids?.includes(analyzer.id));

    if (subjectIds.length) {
      context.dispatch(args.visible ? showSubjects(...subjectIds) : hideSubjects(...subjectIds));
    }

    if (featureIds.length) {
      context.dispatch(args.visible ? showFeatures(...featureIds) : hideFeatures(...featureIds));
    }

    if (foundAnalyzers.length) {
      const analyzerIds = foundAnalyzers.map((analyzer) => analyzer.id);

      if (args.visible) {
        context.dispatch(showAnalyzers(...analyzerIds));
      } else {
        // The map keeps a hidden analyzer's selection, so it is cleared as in the tab.
        setAnalyzerFeatureActiveStateForIDs(
          context.map,
          foundAnalyzers.flatMap((analyzer) => analyzer.features.map((feature) => feature.properties.id)),
          false
        );
        context.dispatch(hideAnalyzers(...analyzerIds));
      }
    }

    if (args.events_layer) {
      context.dispatch(displayReportsOnMapState(args.visible));
    }

    return {
      not_found: {
        analyzer_ids: (args.analyzer_ids ?? [])
          .filter((analyzerId) => !foundAnalyzers.some((analyzer) => analyzer.id === analyzerId)),
        feature_ids: (args.feature_ids ?? []).filter((featureId) => !allFeatureIds.has(featureId)),
        feature_set_ids: (args.feature_set_ids ?? [])
          .filter((featureSetId) => !foundFeatureSets.some((featureSet) => featureSet.id === featureSetId)),
        subject_group_ids: (args.subject_group_ids ?? [])
          .filter((subjectGroupId) => !foundSubjectGroups.some((subjectGroup) => subjectGroup.id === subjectGroupId)),
        subject_ids: (args.subject_ids ?? []).filter((subjectId) => !foundSubjectIds.includes(subjectId)),
      },
      updated: {
        analyzers: foundAnalyzers.length,
        events_layer: !!args.events_layer,
        features: featureIds.length,
        subjects: subjectIds.length,
      },
      visible: args.visible,
    };
  },
};

export default setMapLayerVisibilityTool;
