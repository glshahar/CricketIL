var mongoose = require('mongoose');

var schema = mongoose.Schema;
var userSchema = new schema({
	email: String,
	password: String,
	gcmId: String,
	popTune: Number,
	popVibrate: Number,
	popMobile: Number,
    popWeb: Number,
    popMail: Number,
    autoUpdate: Number,
    needRefresh: Number,
	address: String,
	products: [],
	results: []
}, {collection: 'users'});

var User = mongoose.model('User', userSchema);

module.exports = User;
