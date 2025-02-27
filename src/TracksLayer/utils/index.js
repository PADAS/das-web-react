
export const segmentTrackPointsByTimeOfDayPeriodPairs = (twoPointLineStringTrackPoints) => {
  const segmentsByColorPair = {};
  let segmentsWithMissingColors = 0;

  twoPointLineStringTrackPoints.features.forEach((segment) => {
    // Skip segments without required color properties
    if (!segment.properties?.startColor || !segment.properties?.endColor) {
      segmentsWithMissingColors++;
      return;
    }

    const key = `${segment.properties.startColor}|${segment.properties.endColor}`;
    if (!segmentsByColorPair[key]) {
      segmentsByColorPair[key] = [];
    }
    segmentsByColorPair[key].push(segment);
  });

  if (segmentsWithMissingColors > 0){
    console.warn('Segments with missing colors:', segmentsWithMissingColors);
  }

  return segmentsByColorPair;
};

export const generateMapSourcesAndLayersBasedOnTwoLineTrackPointsSegments = (trackData, isTimeOfDayColoringActive, sourceId, layerId, layerLayout, layerOptions) => {

  if (!trackData?.twoPointLineStringTrackPoints?.features?.length || !isTimeOfDayColoringActive) {
    return { sourcesConfigs: [], layersConfigs: [], hasTimeOfDaySegments: false };
  }

  const sources = [];
  const layers = [];
  const trackPointsSegmentsByColorPair = segmentTrackPointsByTimeOfDayPeriodPairs(trackData.twoPointLineStringTrackPoints);

  Object.entries(trackPointsSegmentsByColorPair).forEach(([colorPairKey, segments], index) => {
    const [startColor, endColor] = colorPairKey.split('|');
    const pairSourceId = `${sourceId}-colorpair-${index}`;
    const pairLayerId = `${layerId}-colorpair-${index}`;

    // Add source config
    sources.push({
      id: pairSourceId,
      data: {
        type: 'FeatureCollection',
        features: segments
      },
      options: {
        tolerance: 1.5,
        type: 'geojson',
        lineMetrics: true
      }
    });

    // Add layer config
    layers.push({
      id: pairLayerId,
      type: 'line',
      sourceId: pairSourceId,
      paint: {
        'line-width': 2,
        'line-gradient': [
          'interpolate',
          ['linear'],
          ['line-progress'],
          0, startColor,
          1, endColor
        ]
      },
      layout: layerLayout,
      options: layerOptions
    });
  });

  return {
    sourcesConfigs: sources,
    layersConfigs: layers,
    hasTimeOfDaySegments: sources.length > 0
  };
};
