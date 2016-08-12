var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
	code: String,
	createdAt: {
		type: Date,
		default: new Date
	}
})

module.exports = mongoose.model('postal', postSchema);