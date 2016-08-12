var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var zipSchema = new Schema({
	code: String,
	createdAt: {
		type: Date,
		default: new Date
	}
})

module.exports = mongoose.model('zipCode', zipSchema);