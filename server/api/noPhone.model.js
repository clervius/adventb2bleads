var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ptinSchema = new Schema({
	link: String,
	name: String,
	created: {
		type: Date,
		default: new Date
	}
});

module.exports = mongoose.model('noPhone', ptinSchema);