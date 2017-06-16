const pics = require('express').Router();
var AWS = require('aws-sdk');

module.exports = pics;

pics.post("/", (req, res) => {
	res.status(202).json({ message: "wadup homie" });

	console.log('aws accessKeyId: ', process.env.AWS_KEYID);
	console.log('aws secretAccessKey: ', process.env.AWS_SECRET);
	console.log('aws region: ', process.env.AWS_REGION);
	var keyId = process.env.AWS_KEYID;
	var s3 = new AWS.S3({
		accessKeyId: keyId,
		secretAccessKey: process.env.AWS_SECRET,
		region: process.env.AWS_REGION
	});

	Object.keys(req.files).map((file) => {
		console.log("file: ", req.files[file]);
		let pic = req.files[file];
		var params = {
			Bucket: 'erica-charlie-pics-test',
			Key: pic.name,
			Body: pic.data
		}
		s3.putObject(params, (err, data) => {
			if(err) {
				console.log("error: ", err);
			} else {
				console.log("Success! Data: ", data);
			}
		})
	});


	// save pics info to aws

	// send pics to database using info from response
});