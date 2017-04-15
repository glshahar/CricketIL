var mongoose =require('mongoose');
var schema = mongoose.Schema;

var productSchema = new schema({
	id: {type:String, index:1, required:true, unique:true},
	url: String,
	store: String,
	brand: String,
	title: String,
	description: String,
	images: [],
	categories: [],
	sizes: [],
	itemsSum: String,
	size: String,
	price: Number,
	shipping: Number,
	amount: Number,
	keyword: String,
	results: [],
	suggestions: []
}, {collection: 'products'});

var Product = mongoose.model('Product', productSchema);

module.exports = Product;