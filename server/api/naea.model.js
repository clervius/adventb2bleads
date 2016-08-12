var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var naeaSchema = new Schema({
	name: String,
	address: String,
	phone: String,
	website: String,
	number: Number,
	created: {
		type: Date,
		default: new Date
	}
})

module.exports = mongoose.model('naea', naeaSchema);