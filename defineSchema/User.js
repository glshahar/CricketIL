var mongoose = require('mongoose');

var schema = mongoose.Schema;
var userSchema = new schema({
	email: "string",
	password: "string",
	gcmId: "string",
	popTune: Number,
	popVibrate: Number,
	popMobile: Number,
    popWeb: Number,
    popMail: Number,
    autoUpdate: Number,
    needRefresh: Number,
	address: "string",
	products: [],
	results: []
}, {collection: 'users'});

var User = mongoose.model('User', userSchema);

module.exports = User;
