var mongoose = require('mongoose');
// Schemes / Collections
var Product = require('./defineSchema/Product');
var User = require('./defineSchema/User');
// var sys = require('sys'),
//     exec = require('child_process').exec;
// var spawn = require('child_process').spawn,
//     py = spawn('python', ['compute_input.py']);
var dateFormat = require('dateformat');
// var nodemailer = require('nodemailer');
// const bunyan = require('bunyan');
// var futures = require('futures');
// var sequence = futures.sequence();
var scrapy = require('node-scrapy');

// Check Login By Email (unique) + Pass
exports.checkLogin = function(req, res){
	var email = req.params.email;
	var password = req.params.password;

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


















	// // PARSE PRODUCT PAGE
	// // python selenium tool
 //    var python = require('child_process').spawn(
 //    'python', ["test.py", url, email]);
 //    var dataString = '';
 //    var searchTest = "";

	// python.stdout.on('data', function(data){
	//   dataString += data.toString();
	// });
	// python.stdout.on('end', function(){
	//     console.log('Return Data: ',dataString);
	//     if(dataString == "")
	//   	    return res.status(500).send();
	//   	else searchKeyword = dataString
	//     console.log("finish add product");
	//     console.log(searchKeyword);
	//     searchUrl();
	//     return res.status(200).send();
	// });

	// // python scrapy tool
	// function searchUrl(){
	// 	exec('scrapy crawl cricket -a start_url="'+url+'" -a userEmail="'+email+'"', function(err, stdout, stderr) {
	//         console.log("scrapy: " + err + " : "  + stdout);
	//         // searchKeyword = stdout;
	//         // console.log("KEY: "+searchKeyword);
	//         // setTimeout(searchUrl,2000);
	//     });
	// };



	// PARSE SEARCH PAGE

	// // npm scrapy tool
	// function searchUrl(){
	// 	var scrapy = require('Scrapy');
	// 	// var scrapy = new Scrapy();
	// 	var searchUrl = 'http://www.ebay.com/sch/i.html?_from=R40&_sacat=0&_nkw='+searchKeyword+'&rt=nc&LH_BIN=1';

	// 	scrapy.loop(searchUrl, { end: 30 }, function($) {
	// 		$('.lvtitle h3').each(function() {
	// 			console.log( $(this).text().trim() );
	// 		});
	// 	});
	// };


	// // npm skim tool
	// function searchUrl(){
	// 	var searchUrl = 'http://www.ebay.com/sch/i.html?_from=R40&_sacat=0&_nkw='+searchKeyword+'&rt=nc&LH_BIN=1';
	// 	rem.stream(searchUrl).pipe(skim({
	// 	  "$query": "div.lvpicinner ~ div ~ div.lvpicinner > a",
	// 	  "$each": {
	// 	    "title": "(text)",
	// 	    "link": "(attr href)"
	// 	  }
	// 	}, function (err, json) {
	// 	  console.log(json);
	// 	}));
	// };


	// // python scrapy tool
	// function searchUrl(){
	//     exec('scrapy crawl search_spider -a email="'+email+'" -a search="'+searchKeyword+'"', function(err, stdout, stderr) {
	//     	searchTest = stdout;
	// 		console.log("search: " + err + " : "  + searchTest);
	// 		if(searchTest != "")
	// 			// sendEmail();
	// 			return res.status(200).send();
	// 	});
	// };


	// // npm html-scrapper tool
	// function searchUrl(){ 
	// 	var scrapper = require('html-scrapper');
	// 	var Source = scrapper.Source;
	// 	var Extractor = scrapper.Extractor;
	// 	var Fn = scrapper.Fn;
	// 	var searchUrl = 'http://www.ebay.com/sch/i.html?_from=R40&_sacat=0&_nkw='+searchKeyword+'&rt=nc&LH_BIN=1';
	// 	var github = new Source('get', searchUrl );
	// 	var dataSchema = {
	// 	    results:[ {
	// 	        $rule: '.sresult > h3 > a',
	// 	        name: ':nth-child(0)',
	// 	        forks: ':nth-child(1)',
	// 	        stars: {
	// 	            $rule: ':nth-child(2)',
	// 	            $fn: Fn.asInt
	// 	        }
	// 	    }]
	// 	};
	// 	var extractor = new Extractor( dataSchema );
	// 	github.read(function(err, res ){
	// 	    var data = extractor.extract( res.body );
	// 	    console.log( data );
	// 	});
	// };



	// // npm node-scrapy tool
	// function searchUrl(){
	// 	var scrapy = require('node-scrapy'), count=0, searchResults = [],
	// 	url = 'http://www.ebay.com/sch/i.html?_from=R40&_sacat=0&_nkw='+searchKeyword+'&rt=nc&LH_BIN=1'
	// 		model = { maintainers: 
	// 	              { selector: '.lvtitle a',
	// 	                get: 'href',
	// 	                prefix: '' } }	 
	// 	scrapy.scrape(url, model, function(err, data) {
	// 	    if (err) return console.error(err)
	// 	    searchResults = data.maintainers;
	// 	    console.log(searchResults);
	// 	    searchResults.forEach(function (item) {
	// 	    	console.log("item :"+item);
	// 	    	count++;
	// 	    	if(count==2){
	// 			  	var python = require('child_process').spawn(
	// 			    'python', ["test.py", item, email]);
	// 			    var dataString = '';
	// 			    var searchTest = "";

	// 				python.stdout.on('data', function(data){
	// 				  dataString += data.toString();
	// 				});
	// 				python.stdout.on('end', function(){
	// 				    console.log('Return Data: ',dataString);
	// 				    if(dataString == "")
	// 				  	    return res.status(500).send();
	// 				  	else searchKeyword = dataString
	// 				    console.log("finish add product");
	// 				    // console.log(searchKeyword);
	// 				    // searchUrl();
	// 				    return res.status(200).send();
	// 				});
	// 			}
	// 		})
	// 	});
	// };





	// // send email to user - function
	// function sendEmail(){
	// 	// email = cricketownil@gmail.com
	// 	// pass = cricket123
	// 	var text = 'Hello world from cricketownIL@gmail.com';
	// 	// Create a SMTP transporter object
	// 	let transporter = nodemailer.createTransport({
	// 	    service: 'Gmail',
	// 	    auth: {
	// 	        user: 'cricketownIL@gmail.com',
	// 	        pass:  'cricket123'
	// 	    },
	// 	    logger: bunyan.createLogger({
	// 	        name: 'nodemailer'
	// 	    }),
	// 	    debug: true // include SMTP traffic in the logs
	// 	}, {
	// 	    // default message fields

	// 	    // sender info
	// 	    from: 'Pangalink <no-reply@pangalink.net>',
	// 	    headers: {
	// 	        'X-Laziness-level': 1000 // just an example header, no need to use this
	// 	    }
	// 	});
	// 	console.log('SMTP Configured');
	// 	// Message object
	// 	let message = {

	// 	    // Comma separated list of recipients
	// 	    to: 'Gal <galsh20@gmail.com>',

	// 	    // Subject of the message
	// 	    subject: 'Nodemailer is unicode friendly ✔ #', //

	// 	    // plaintext body
	// 	    text: 'Hello to myself!',

	// 	    // HTML body
	// 	    html: '<p><b>Hello</b> to myself <img src="cid:note@example.com"/></p>' +
	// 	        '<p>Here\'s a nyan cat for you as an embedded attachment:<br/><img src="cid:nyan@example.com"/></p>',

	// 	    // Apple Watch specific HTML body
	// 	    watchHtml: '<b>Hello</b> to myself',

	// 	    // An array of attachments
	// 	    attachments: [

	// 	        // String attachment
	// 	        {
	// 	            filename: 'notes.txt',
	// 	            content: 'Some notes about this e-mail',
	// 	            contentType: 'text/plain' // optional, would be detected from the filename
	// 	        },

	// 	        // Binary Buffer attachment
	// 	        {
	// 	            filename: 'image.png',
	// 	            content: new Buffer('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD/' +
	// 	                '//+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4U' +
	// 	                'g9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC', 'base64'),

	// 	            cid: 'note@example.com' // should be as unique as possible
	// 	        },

	// 	        // File Stream attachment
	// 	        {
	// 	            filename: 'nyan cat ✔.gif',
	// 	            path: __dirname + '/assets/nyan.gif',
	// 	            cid: 'nyan@example.com' // should be as unique as possible
	// 	        }
	// 	    ]
	// 	};
	//     var mailOptions = {
	// 	    from: 'cricketownIL@gmail.com', // sender address
	// 	    to: 'galsh20@gmail.com', // list of receivers
	// 	    subject: 'Email Example', // Subject line
	// 	    text: text //, // plaintext body
	// 	    // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
	// 	};
	// 	transporter.sendMail(message, function(error, info){
	// 	    if(error){
	// 	        console.log(error);
	// 	        res.json({yo: 'error'});
	// 	    }else{
	// 	        console.log('Message sent: ' + info.response);
	// 	        res.json({yo: info.response});
	// 	    };
	// 	});
	// 	transporter.close();
	// }


};

