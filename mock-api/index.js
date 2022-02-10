const models = require('./models');

// To make it work go to file: src/ducks/subjects.js
// and change the full value for SUBJECTS_API_URL to 'http://localhost:9000/api/v1.0/subjects'
const generateSubjectsData = () => {
  const subjects = [];

  const number = 50;
  for (let i = 0; i < number; i++) {
    subjects.push(models.generateSubject());
  }

  return {
    data: subjects,
    status: {
      code: 200,
      message: 'OK',
    },
  };
};

module.exports = () => ({
  subjects: generateSubjectsData(),
});
