const login = require('express').Router();
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

validateCreds = (username, password) => {
	// look up username
	// hash password provided
	// if the user is found, compare hashed password to value stored in database
	// maybe start off by just comparing the username and password directly
	return new Promise((fullfill, reject) => {
		var url = 'mongodb://localhost:27017/pics-api';
		MongoClient.connect(url, function(err, db) {
			if(err) {
				console.log("error: ", err);
				reject();
			} else {
				console.log("Connected correctly to server.");
				findUser(db, username, password, (users) => {
					if(users.length > 0) {
						fullfill("token");
					} else {
						fullfill(null);
					}
				});
			}
		});
	});
}

// check body for username and password
// hash password
// look up username in db
// compare hashed password to version in db
// if it matches, return a token and status 200, else, 404
login.post('/', (req, res) => {
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

module.exports = login;
