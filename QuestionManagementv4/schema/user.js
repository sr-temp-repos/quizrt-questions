
var mongoose = require('mongoose');

var userSchema = {
	id: String,
	username: String,
	password: String,
	email: String,
	firstName: String,
	lastName: String
};
module.exports = new mongoose.Schema(userSchema);
