
export const segmentTrackPointsByTimeOfDayPeriodPairs = (trackSegments) => {
  const segmentsByColorPair = {};

  trackSegments.features.forEach((segment) => {
    // Skip segments without required color properties
    if (!segment.properties?.startColor || !segment.properties?.endColor) {
      return;
    }

    const key = `${segment.properties.startColor}|${segment.properties.endColor}`;
    if (!segmentsByColorPair[key]) {
      segmentsByColorPair[key] = [];
    }
    segmentsByColorPair[key].push(segment);
  });

  return segmentsByColorPair;
};
