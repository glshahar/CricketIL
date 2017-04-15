var mongoose = require('mongoose');
var schema = mongoose.Schema;

var productSchema = new schema({
	_id: {type:String, index:1, required:true, unique:true},
	url: "string",
	store: "string",
	brand: "string",
	title: "string",
	description: "string",
	images: "string",
	categories: [],
	sizes: [],
	itemsSum: "string",
	size: "string",
	price: "string", // temp String
	shipping: "string",
	amount: Number,
	keyword: "string",
	results: [],
	suggestions: []
}, {collection: 'products'});

var Product = mongoose.model('Product', productSchema);

module.exports = Product;