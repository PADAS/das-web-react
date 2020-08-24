// export const getPatrolListState = createSelector(
//   [patrolItems],
//   (patrolItems) => {
//     const patrols = (patrolItems).map((patrol) => {
//       return patrol;
//     });
//     const typeNames = uniq(analyzerFeatures.map(analyzer => analyzer.type));
//     const featuresByType = typeNames.map((name) => ({
//       name,
//       features: features.filter(f => f.analyzer_type === name),
//     }));
//     return ([{ name: 'Analyzers', id: 'analyzers', featuresByType }]);
//   });