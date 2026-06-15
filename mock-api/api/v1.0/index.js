const express = require('express');

const events = require('./activity/events');
const eventtypes = require('./activity/eventtypes');

const apiv1 = express.Router();

apiv1.use('/activity/events', events);
apiv1.use('/activity/eventtypes', eventtypes);

module.exports = apiv1;
