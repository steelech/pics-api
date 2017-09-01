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

const getAllAlbums = () => {
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      db.collection('albums').find({}).toArray(function(err, results) {
        if (err) {
          console.log('error');
        } else {
          resolve(results);
        }
      })
    })
  })
}

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
  const albumName = req.body.name;
  saveNewAlbum(albumName).then(results => {
    console.log('album saved!');
    res.status(200).json({ message: 'album created' });
  });
});

albums.get('/', (req, res) => {
  getAllAlbums().then(results => {
    res.status(200).json(results);
  })
});
