const pics = require('express').Router();
var AWS = require('aws-sdk');
var MongoClient = require('mongodb').MongoClient;

module.exports = pics;

const savePicToDB = (key) => {
	var url = 'mongodb://localhost:27017/pics-api';
	MongoClient.connect(url, (err, db) => {
		if(err) {
			console.log('error');
		} else {
			// save pic to database
			db.collection('pictures').insertOne({
				key
			}, (error, result) => {
				if(error) {
					console.log('error: ', error);
				}
				else {
					console.log('result: ', result);
				}
			})
		}
	})
}

pics.post("/", (req, res) => {

	var s3 = new AWS.S3({
		accessKeyId: process.env.AWS_KEYID,
		secretAccessKey: process.env.AWS_SECRET,
		region: process.env.AWS_REGION
	});
	var length = Object.keys(req.files).length;
	var count = 0;


	// instead of doing this, we should make it so that we wait until the previous request
	// has returned, so we don't overwhelm the s3 server
	var fileNames = Object.keys(req.files);
	var sendFile = (count) => {
		let pic = req.files[fileNames[count]];
		var params = {
			Bucket: 'erica-charlie-pics-test',
			Key: pic.name,
			Body: pic.data
		}
		console.log('sending: ', pic.name);
		s3.putObject(params, (err, data) => {
			if(err) {
				console.log('error: ', err);
			} else {
				console.log('success');
				savePicToDB(pic.name);
				count++;
				if(count === length) {
					res.status(202).json({ message: "wadup homie" });
				} else {
					sendFile(count)
				}
			}
		})
	}

	sendFile(count);


	// save pics info to aws

	// send pics to database using info from response
});