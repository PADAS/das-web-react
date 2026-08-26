const withLastSegmentTimeRange = (patrol, timeRange) => {
  const lastSegmentIndex = patrol.patrol_segments.length - 1;

  return patrol.patrol_segments.map((segment, index) => index === lastSegmentIndex
    ? { ...segment, time_range: { ...segment.time_range, ...timeRange } }
    : segment);
};

export default withLastSegmentTimeRange;
