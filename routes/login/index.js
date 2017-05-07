const login = require('express').Router();
login.get('/', function(req, res) {
	res.status(200).json({message: 'Login'});
})

module.exports = login;
