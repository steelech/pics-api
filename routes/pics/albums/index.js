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

const getNextSequenceValue = db => {
  return new Promise((resolve, reject) => {
    const high = db
      .collection('albums')
      .find({})
      .sort({ _id: -1 })
      .limit(1)
      .toArray(function(err, results) {
        if (results.length) {
          resolve(results[0]._id + 1);
        } else {
          resolve(1);
        }
      });
  });
};

const getAllAlbums = () => {
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      getNextSequenceValue(db);
      db.collection('albums').find({}).toArray(function(err, results) {
        if (err) {
          console.log('error');
        } else {
          resolve(results);
        }
      });
    });
  });
};

const getOneAlbum = _id => {
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      db.collection('albums').find({ "_id": parseInt(_id) }).toArray(function(err, record) {
        if (err) {
          console.log('error');
        } else {
          resolve(record);
        }
      });
    });
  });
};

const saveNewAlbum = name => {
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      getNextSequenceValue(db).then(seqNo => {
        console.log('ID: ', seqNo);
        const record = {
          name,
          _id: seqNo
        };
        db.collection('albums').insert(record, (error, results) => {
          if (error) {
            reject();
          } else {
            resolve(results);
          }
        });
      });
    });
  });
};

albums.post('/', (req, res) => {
  const albumName = req.body.name;
  saveNewAlbum(albumName).then(results => {
    res.status(200).json({ message: 'album created' });
  });
});

albums.get('/', (req, res) => {
  if (req.query.id) {
    getOneAlbum(req.query.id).then(album => {
      res.status(200).json(album);
    });
  } else {
    getAllAlbums().then(results => {
      res.status(200).json(results);
    });
  }
});
