const pics = require('express').Router();
var AWS = require('aws-sdk');
var MongoClient = require('mongodb').MongoClient;

module.exports = pics;

const updatePic = pic => {
	return new Promise((resolve, reject) => {
		resolve(pic);
	})
};

const updatePics = pics => {
	return new Promise((resolve, reject) => {
		Promise.all(pics.map(updatePic))
			.then(resolve);
	})
};

const connectToDB = () => {
	return new Promise((resolve, reject) => {
		var url = 'mongodb://localhost:27017/pics-api';
		MongoClient.connect(url, (err, db) => {
			if(err) {
				reject(err);
			} else {
				resolve(db);
			}
		})
	})
}

const queryDB = (db) => {
	return new Promise((resolve, reject) => {
		db.collection('pictures').find({}).toArray(function(error, results) {
			if(error) {
				console.log('error')
			} else {
				resolve(results);
			}
		})
	})
};

const getAllPicsFromDB = (db) => {
	return new Promise((resolve, reject) => {
		connectToDB()
			.then(queryDB)
			.then(updatePics)
			.then(resolve);
	});
};

const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_KEYID,
	secretAccessKey: process.env.AWS_SECRET,
	region: process.env.AWS_REGION
});

const getSignedUrl = key => {
	return s3.getSignedUrl('getObject', {
		Bucket: 'erica-charlie-pics-test',
		Key: key
	})
};

const savePicsToDB = (keys) => {
	console.log("keys: ", keys);
	var url = 'mongodb://localhost:27017/pics-api';
	MongoClient.connect(url, (err, db) => {
		if(err) {
			console.log('error');
		} else {
			// save pic to database
			db.collection('pictures').insertMany(keys,
			 (error, result) => {
				if(error) {
					console.log('error: ', error);
				}
				else {
					console.log('result: ', result);
				}
			})
		}
	})
};

const getAllPics = () => {
	return new Promise((resolve, reject) => {
		var url = 'mongodb://localhost:27017/pics-api';
		getAllPicsFromDB()
			.then(resolve)
			.catch(console.log)
	})
};


pics.get("/", (req, res) => {
	getAllPics()
		.then((pics) => {
			res.status(200).json({ pics: pics });
		});
})

pics.post("/", (req, res) => {
	var s3 = new AWS.S3({
		accessKeyId: process.env.AWS_KEYID,
		secretAccessKey: process.env.AWS_SECRET,
		region: process.env.AWS_REGION
	});

	var length = Object.keys(req.files).length;
	var count = 0;
	var fileNames = Object.keys(req.files);
	var uploads = [];

	var sendFile = (count) => {
		let pic = req.files[fileNames[count]];
		var params = {
			Bucket: 'erica-charlie-pics-test',
			Key: pic.name,
			Body: pic.data
		}
		s3.putObject(params, (err, data) => {
			if(err) {
				console.log('error: ', err);
			} else {
				console.log('success');
				uploads.push(pic.name)
				count++;
				let urlParams = {
					Bucket: 'erica-charlie-pics-test',
					Key: pic.name
				}
				var url = s3.getSignedUrl('getObject', urlParams);
				console.log('url: ', url);
				if(count === length) {
					savePicsToDB(uploads.map((name) => {
						return { 
							key: name,
							url: url 
						}
					}));
					res.status(202).json({ message: uploads });
				} else {
					sendFile(count)
				}
			}
		})
	}

	sendFile(count);
});