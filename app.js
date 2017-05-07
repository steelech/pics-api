var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser.json());
var port = process.argv[2] || 8888;
var routes = require('./routes');
var cors = require('cors');

var logger = function(req, res, next) {
	console.log("REQUEST: ", req.method + " " + req.url + " " + JSON.stringify(req.headers));
	next();
}

app.use(logger);
app.use("/", routes);
app.use(cors());

console.log("backend server listening at port ", port);
app.listen(port);
