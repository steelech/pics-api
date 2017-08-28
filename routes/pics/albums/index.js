const albums = require('express').Router();
const util = require('util');
var MongoClient = require('mongodb').MongoClient;

module.exports = albums;

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

const saveNewAlbum = name => {
  const record = {
    name
  };
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      db.collection('albums').insert(record, (error, results) => {
        if (error) {
          reject();
        } else {
          resolve(results);
        }
      });
    });
  });
};

albums.post('/', (req, res) => {
  console.log(`REQUEST: ${util.inspect(req.body.name)}`);
  const albumName = req.body.name;
  // save album to database
  saveNewAlbum(albumName).then(results => {
    console.log('album saved!');
  });
  res.status(200).json({ message: 'ALBUMS POST' });
});

albums.get('/', (req, res) => {
  res.status(200).json({ message: 'ALBUMS GET' });
});
