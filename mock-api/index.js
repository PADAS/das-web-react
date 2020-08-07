const models = require('./models');
const utils = require('./utils');


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

const generatePatrolData = () => {
  const patrols = generateMockPatrols(utils.randomInteger());
  return {
    count: patrols.length,
    next: null,
    previous: null,
    results: patrols,
  };
};

module.exports = () => ({
  patrols: generatePatrolData(),
  patrol_types: []/* generateMockPatrolTypes() */,
  patrol_segments: [] /* generateMockPatrolSegments() */,
  patrol_templates: [] /* generateMockPatrolTemplates() */,
});


