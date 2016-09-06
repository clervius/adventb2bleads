var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var eaLeadSchema = new Schema({
	number: String,
	created: {
		type: Date,
		default: new Date
	}
})

module.exports = mongoose.model('smsDone', eaLeadSchema);