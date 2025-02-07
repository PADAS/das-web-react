const express = require('express');

const eventtypes = require('./activity/eventtypes');

const apiV2 = express.Router();

apiV2.use('/activity/eventtypes', eventtypes);

module.exports = apiV2;
