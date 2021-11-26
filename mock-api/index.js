const models = require('./models');

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
