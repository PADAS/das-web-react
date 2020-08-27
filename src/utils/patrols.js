export const generatePseudoReportCategoryForPatrolTypes = (patrolTypes) => {
  const categoryObject = {
    'value': 'patrols',
    'display': 'Patrols',
    'ordernum': 0,
    'flag': 'user',
    'permissions': [
      'create',
      'update',
      'read',
      'delete'
    ],
  };

  return {
    ...categoryObject,
    types: patrolTypes.map(type => ({
      ...type,
      category: { ...categoryObject },
    })),
  };
};

export const createNewPatrolForPatrolType = ({ value: patrol_type, icon_id, default_priority: priority = 0 }) => ({
  icon_id,
  is_collection: false,
  // state: 'active',
  priority,
  created_at: new Date(),
  patrol_segments: [
    {
      patrol_type,
      priority,
      reports: [],
      scheduled_start: null,
      sources: [],
      start_location: null,
      start_time: null,
      end_time: null,
      end_location: null,
    },
  ],
  files: [],
  notes: [],
  title: null,
});
