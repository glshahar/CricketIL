var mongoose = require('mongoose');
// Schemes / Collections
var Product = require('./defineSchema/Product');
var User = require('./defineSchema/User');
//var sys = require('sys'),
//    exec = require('child_process').exec;
////var spawn = require('child_process').spawn,
//    py = spawn('python', ['compute_input.py']);
var dateFormat = require('dateformat');
// var nodemailer = require('nodemailer');
// const bunyan = require('bunyan');
var scrapy = require('node-scrapy');


// Check Login By Email (unique) + Pass
exports.checkLogin = function(req, res){
	var email = req.body.email;
	var password = req.body.password;

	var now = new Date();
	dateFormat(now, "fullDate");
	console.log("Checking Login.. "+email+" "+password+" "+now);

	var query = User.findOne({}).where('email').equals(email). 
								 where('password').equals(password).
								 exec (function(err, user){
	if(err){
		console.log(err);
		return res.status(500).send();
	}
	if(!user){
		console.log("Email / Password Incorrect");
		return res.status(404).send();
	}
	console.log("Connected Successfully");
	return res.status(200).send(user);
	})
};

// for testtttttt
exports.removeAll = function(req, res){
	var email = req.body.email;
	console.log("Remove Cart By Email: "+email+"");
	User.update(
	  { "email": email },
	  { "$set": { "results": [] } }, 
	  			  {multi:true}
	).exec (function(err, prod){
		if(err){
			console.log(err);
			return res.status(500).send();
		}
		if(!prod){
			console.log("No Product were found");
			return res.status(404).send();
		}
		console.log("Remove Successfully");
		return res.status(200).send(prod);
		})
};

// Remove Product By Email (unique) + Pass
exports.removeItem = function(req, res){
	var email = req.body.email;
	var prodId = req.body.prodId;
	console.log("Remove Product: "+prodId+"  By Email: "+email+"");

	User.update(
	  { "email": email },
	  { "$pull": { "products": { "_id": prodId } } }, 
	  			  {multi:true}
	).exec (function(err, prod){
		if(err){
			console.log(err);
			return res.status(500).send();
		}
		if(!prod){
			console.log("No Product were found");
			return res.status(404).send();
		}
		console.log("Remove Successfully");
		return res.status(200).send(prod);
	})
};

exports.refreshItem = function(req, res){
	var email = req.body.email;
	var prodId = req.body.prodId;
	console.log("Refresh Product: "+prodId+"  By Email: "+email+"");

	var query = User.findOne({}).where('email').equals(email). 
		select('products').find('_id').equals(prodId).
		exec (function(err, prod){
			if(err){
				console.log(err);
				return res.status(500).send();
			}
			if(!prod){
				console.log("No Product were found");
				return res.status(404).send();
			}
			console.log("Refresh Successfully");
			console.log("PRODUCT: "+prod);
			return res.status(200).send(prod);
		})
};


exports.addNewItem = function(req, res){

	var email = req.body.email;
	var url = req.body.url;
	console.log("Add New URL: "+url);
	console.log("By Email: "+email);
	var newProduct = new Product();
	var searchKeyword = "";

	// get store name
	var urlsplit = url.split('www.');
	var urlstore = urlsplit[1].split('.com');
	var store = urlstore[0];

	// set URL
	newProduct.url = url;

	// set Stroe
	newProduct.store = store;
	

	if(store=="ebay"){

		var modelEbay =
		    {   _id: '#descItemNumber',
		        title: 'h1#itemTitle',
		        price1: 'span#prcIsum',
		        price2: 'span#mm-saleDscPrc',
		        category1: 'li.bc-w > a.thrd',
		        category2: 'li.bc-w > a.scnd',
		        des: 'td',
		        shipping: 'span#fshippingCost > span'
		    };

		var modelEbayImg = { maintainers: 
		              { selector: '#icImg',
		                get: 'src',
		                prefix: '' } };
		 
		scrapy.scrape(url, modelEbay, function(err, data) {
		    if (err) return console.error(err)
		    console.log(data);

			// set _Id (unique for Ebay-> ambiguity ?)
			newProduct._id = data._id;

			// set Title
			var words = data.title.split("Details about");
			var title = words[1];
			newProduct.title = title;

			// set Brand
			for(i=0; i<data.des.length; i++)
				if(data.des[i]=="Brand:")
					newProduct.brand = data.des[i+1];

			// set Description
			for(i=0; i<data.des.length; i++)
				if(data.des[i]=="Condition:")
					newProduct.description = data.des[i+1];

			// set Price
			if(data.price1!=null)
				newProduct.price = data.price1;
			else newProduct.price = data.price2;

			// set Shipping
			if(data.shipping)
				newProduct.shipping = data.shipping[0];
			else newProduct.shipping = "may not ship to your country";

			// set Categories
			newProduct.categories = [data.category1[0], data.category1[1], data.category2];

			searchKeyword = title;

			scrapy.scrape(url, modelEbayImg, function(err, data) {
			    if (err) return console.error(err)
			    console.log(data.maintainers[0]);

				// set Images
				newProduct.images = data.maintainers[0];
				saveProduct(newProduct);
			});

		});
	};


	if(store=="amazon"){

		var modelAmazon =
			{   title: 'h1#title > span',
				all: 'span',
				brand: 'a#brand',
			    price: 'span#priceblock_ourprice',
			    category: 'span.a-list-item > a',
			    description: 'div#productDescription > p',
			    shipping: 'span#ourprice_shippingmessage > span'
			};

		var modelAmazonImg = { maintainers: 
			{   selector: 'div.imgTagWrapper > img',
			    get: 'src',
			    prefix: '' } 
			};
			    
		// get item id (amazon unique)
	    var urlsplit = url.split('/');
	    var itemId = urlsplit[5].split('/');
	    newProduct._id = itemId[0];

		scrapy.scrape(url, modelAmazon, function(err, data) {
			if (err) return console.error(err);
			else console.log(data);

			// set Title
			newProduct.title = data.title;
			var title = data.titlel
			console.log(data.all);

			// set Brand
			newProduct.brand = data.brand;

			// set Description
			if(data.description)
				newProduct.description = data.description;

			// set Price
			if(data.price)
				newProduct.price = data.price;

			// set Shipping
			if(data.shipping)
				newProduct.shipping = data.shipping;

			// set Categories
			if(data.category)
				newProduct.categories = [data.category[0], data.category[1], data.category[2]];

			searchKeyword = title;

			scrapy.scrape(url, modelAmazonImg, function(err, data) {
				if (err) return console.error(err)

				console.log(data);
				// set Images
				newProduct.images = data.maintainers;
				saveProduct(newProduct);
			});

		});
	}

	if(store=="aliexpress"){

		var modelAliexpress =
			{   title: 'h1.product-name',
				// brand: 'span.propery-des',
			    price: 'span.p-price',
			    category: 'div.container > a',
			    description: 'li.property-item > span',
			    shipping: 'script'
			};

		var modelAliexpressImg = { maintainers: 
			{   selector: 'a > img',
			    get: 'src',
			    prefix: '' } 
			};
			    
        // get item id (aliexpress unique)
        var urlsplit = url.split('/');
        var itemId = urlsplit[5].split('.html');
        newProduct._id = itemId[0];

		scrapy.scrape(url, modelAliexpress, function(err, data) {
			if (err) return console.error(err);
			console.log(data);

			// set Title
			newProduct.title = data.title;
			var title = data.titlel

			// set Brand
			for(i=0; i<data.description.length; i++)
				if(data.description[i]=="Brand Name:")
					newProduct.brand = data.description[i+1];
			// newProduct.brand = data.brand;

			// set Description
			if(data.description)
				newProduct.description = data.description;

			// set Price
			if(data.price)
				if(data.price[1])
					newProduct.price = data.price[1];
				else newProduct.price = data.price;

			// set Shipping
			if(data.shipping){
				// var tmpShip = data.shipping.split(" ");
				// newProduct.shipping = data.shipping;
				newProduct.shipping = "Free Shipping"
			}

			// set Categories
			if(data.category)
				newProduct.categories = [data.category[0], data.category[1], data.category[2]];

			searchKeyword = title;

			scrapy.scrape(url, modelAliexpressImg, function(err, data) {
				if (err) return console.error(err)
				    console.log(data);

				// set Images
				newProduct.images = data.maintainers;
				saveProduct(newProduct);
			});

		});
	}
    
    
	function saveProduct(newProduct){
		User.update(
		  { "email": email },
		  { "$push": { "products": newProduct } } ).
			exec (function(err, newProduct){
				if(err){
					console.log(err);
					return res.status(500).send();
				}
				if(!newProduct){
					console.log("Email / Password Incorrect");
					return res.status(404).send();
				}
				console.log("Product Saved Successfully");
				console.log("Search Engine Start => "+searchKeyword);
				return res.status(200).send(newProduct);
		})
	};
}