var express = require("express");
var bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');
require('dotenv').config();

var app = express();

app.use(bodyParser.json());
app.use(fileUpload());
var port = process.argv[2] || 8888;
var routes = require('./routes');
var logger = (req, res, next) => {
	console.log("REQUEST: ", req.method + " " + req.url + " " + JSON.stringify(req.headers));
	next();
}

// enable cors for requests from frontend
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
})
app.use(logger);
app.use("/", routes);

console.log("backend server listening at port ", port);
app.listen(port);
