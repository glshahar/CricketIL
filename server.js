var express = require('express');
var app = express();
var bodyParser  = require('body-parser');
var db = require('./dbController');
var port = process.env.PORT || 3000;
var fs = require('fs');
// var urlrouter = require('urlrouter');
var http = http = require('http');

// var allowCrossDomain = function(req, res, next) {
//         // Website you wish to allow to connect
//     res.setHeader('Access-Control-Allow-Origin', '*');

//     // Request methods you wish to allow
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

//     // Request headers you wish to allow
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

//     // Set to true if you need the website to include cookies in the requests sent
//     // to the API (e.g. in case you use sessions)
//     res.setHeader('Access-Control-Allow-Credentials', true);
//    next();
// }

/*** Server settings ***/
app.use('/', express.static('./public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(function(req, res, next){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Content-Type", "application/json");	
	res.header('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	next();
});


// app.use(allowCrossDomain);


/*** All routes ***/
app.post('/checkLogin', db.checkLogin);
app.post('/removeAll', db.removeAll);
app.post('/removeItem', db.removeItem);
app.post('/addNewItem', db.addNewItem);
app.post('/refreshItem', db.refreshItem);

app.listen(port);
console.log("listening on port " + port);