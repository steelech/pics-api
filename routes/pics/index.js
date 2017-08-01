const pics = require('express').Router();
var AWS = require('aws-sdk');
var MongoClient = require('mongodb').MongoClient;

module.exports = pics;

const updatePic = pic => {
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      var url = getSignedUrl(pic.key);
      var expirationDate = Date.now() + 5 * 60000;

      db.collection('pictures').updateOne(
        {
          key: pic.key
        },
        {
          $set: {
            url: url,
            expirationDate: expirationDate
          }
        }
      );
      resolve({
        key: pic.key,
        url: url,
        expirationDate: expirationDate
      });
    });
  });
};

const updatePics = pics => {
  return new Promise((resolve, reject) => {
    Promise.all(pics.map(updatePic)).then(resolve);
  });
};

const connectToDB = () => {
  return new Promise((resolve, reject) => {
    var url = 'mongodb://localhost:27017/pics-api';
    MongoClient.connect(url, (err, db) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
};

const queryDB = db => {
  return new Promise((resolve, reject) => {
    db.collection('pictures').find({}).toArray(function(error, results) {
      if (error) {
        console.log('error');
      } else {
        resolve(results);
      }
    });
  });
};

const getAllPicsFromDB = db => {
  return new Promise((resolve, reject) => {
    connectToDB().then(queryDB).then(updatePics).then(resolve);
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
    Key: key,
    Expires: 300
  });
};

const savePicsToDB = pics => {
  const Bucket = 'erica-charlie-pics-test';
  const expirationDate = Date.now() + 5 * 60000;
  var records = pics.map(pic => {
    return {
      key: pic.name,
      url: getSignedUrl(pic.name),
      expirationDate: expirationDate
    };
  });
  connectToDB().then(db => {
    db.collection('pictures').insertMany(records, (error, result) => {
      if (error) {
        console.log('error: ', error);
      } else {
        console.log('result: ', result);
      }
    });
  });
};

const getAllPics = () => {
  return new Promise((resolve, reject) => {
    var url = 'mongodb://localhost:27017/pics-api';
    getAllPicsFromDB().then(resolve).catch(console.log);
  });
};

pics.get('/', (req, res) => {
  getAllPics().then(pics => {
    res.status(200).json({ pics: pics });
  });
});

pics.post('/', (req, res) => {
  var s3 = new AWS.S3({
    accessKeyId: process.env.AWS_KEYID,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_REGION
  });

  var files = Object.keys(req.files).map(key => req.files[key]);

  var promises = files.map(pic => {
    return new Promise((resolve, reject) => {
      var params = {
        Bucket: 'erica-charlie-pics-test',
        Key: pic.name,
        Body: pic.data
      };

      s3.putObject(params, (err, data) => {
        if (err) {
          console.log('error: ', err);
        } else {
          resolve(pic);
        }
      });
    });
  });

  Promise.all(promises).then(pics => {
    savePicsToDB(pics);
    res.status(200).json({ pics: pics });
  });
});
