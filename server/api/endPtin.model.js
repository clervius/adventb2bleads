var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ptinSchema = new Schema({
	link: String,
	name: String,
	phone: String,
	created: {
		type: Date,
		default: new Date
	}
});

module.exports = mongoose.model('endPtin', ptinSchema);