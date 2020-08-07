const faker = require('faker/locale/en');

const generateSegmentStartTime = () => {
  const currentDate = new Date();
  const option1 = new Date(currentDate.getDate() - randomInteger(1,10));
  const option2 = new Date(currentDate.getDate() - randomInteger(1,10));
  const options = [option1, option2, null];

  return randomItemFromArray(options);
};

const generateSegmentEndTime = () => {
  const options = [null, faker.date.future(), faker.date.recent()];
  return randomItemFromArray(options);
};

const randomItemFromArray = (array) => array[Math.floor(Math.random() * array.length)];

const randomInteger = (low = 1, high = 20) => {
  const min = Math.ceil(low);
  const max = Math.floor(high);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports = {
  generateSegmentStartTime,
  generateSegmentEndTime,
  randomItemFromArray,
  randomInteger,
};