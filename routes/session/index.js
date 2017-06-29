const session = require('express').Router();
var MongoClient = require('mongodb').MongoClient;

var findUser = (db, username, password, callback) => {
	var users = db.collection('users');
	users.find({
		"username": username,
		"password": password
	}).toArray((err, items) => {
		callback(items);
	})
}


// definitely need to write some kind of mongodb helper so that we are only calling
// MongoClient.connect once
validateCreds = (username, password) => {
	return new Promise((fullfill, reject) => {
		var url = 'mongodb://localhost:27017/pics-api';
		MongoClient.connect(url, (err, db) => {
			err
				? fullfill(null)
				: findUser(db, username, password, (users) => {
					users.length > 0 ? fullfill("token") : fullfill(null);
				});
		});
	});
}

// check body for username and password
// hash password
// look up username in db
// compare hashed password to version in db
// if it matches, return a token and status 200, else, 404
session.post('/validate', (req, res) => {
	if(!req.body.username) {
		res.status(404).json({error: "No username provided"});
	} else if(!req.body.password) {
		res.status(404).json({error: "No password provided"});
	} else if(Object.keys(req.body).length > 2) {
		res.status(404).json({error: "Invalid format for request"});
        } else {
		var { username, password } = req.body;
		validateCreds(username, password).then((token) => {
			if(token) {
				res.status(200).json({ token: token });
			} else {
				res.status(404).json({ error: "Invalid creds" });
			}
		});
	}
});

module.exports = session;
