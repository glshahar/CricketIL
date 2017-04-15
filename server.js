var express = require('express');
var app = express();
var bodyParser  = require('body-parser');
var db = require('./dbController');
var port = process.env.PORT || 3000;
var fs = require('fs');


/*** Server settings ***/
app.use('/', express.static('./public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(function(req, res, next){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.set("Content-Type", "application/json");
	next();
});


/*** All routes ***/
app.post('/checkLogin', db.checkLogin);
app.post('/removeAll', db.removeAll);
app.post('/removeItem', db.removeItem);
app.post('/addNewItem', db.addNewItem);
app.post('/refreshItem', db.refreshItem);
app.get('/', function(req, res){
  res.send('hello world');
});

app.listen(port);
console.log("listening on port " + port);