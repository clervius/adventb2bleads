var mongoose = require('mongoose');
	path = require('path');
	

module.exports = function(config){
	mongoose.connect(config.db);

	var db = mongoose.connection;
	db.on('error', console.error.bind(console, "b2b DB is not connected - connection error ..."));
	db.once('open', function callback(){
		console.log('b2b db connection established in ' + config.where + ' at ' + config.db );
	});

}