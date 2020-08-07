const models = require('./models');

const generateMockPatrols = (number) => {
  const results = [];

  for (let i = 0; i < number; i++) {
    results.push(models.generatePatrol());
  }

  return results;
};
/* 
const generateMockPatrolTypes = () => {
  return [];
};

const generateMockPatrolSegments = () => {
  return [];
};

const generateMockPatrolTemplates = () => {
  return [];
}; */

module.exports = () => ({
  patrols: generateMockPatrols(3),
  patrol_types: []/* generateMockPatrolTypes() */,
  patrol_segments: [] /* generateMockPatrolSegments() */,
  patrol_templates: [] /* generateMockPatrolTemplates() */,
});