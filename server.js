var express = require('express');
var	mongoose = require('mongoose');

// Config vars
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var app = express();
var config = require('./server/config/config')[env];

//express setup
require('./server/config/express')(app, config);
// db setup
require('./server/config/mongoose')(config);
// routes
require('./server/config/routes')(app);

//server
app.listen(config.port);
console.log('B2B listening on port ' + config.port + '...');