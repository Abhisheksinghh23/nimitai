const serverless = require('serverless-http');
const app = require('../backend/server.js');

module.exports = serverless(app);
