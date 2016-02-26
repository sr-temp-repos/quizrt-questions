
var mongoose = require('mongoose');

var userSchema = {
	id: String,
	username: String,
	password: String,
	email: String,
	firstName: String,
	lastName: String
};
module.exports = mongoose.model('User',new mongoose.Schema(userSchema),'users');
