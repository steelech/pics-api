const pics = require('express').Router();
const im = require('imagemagick');
var AWS = require('aws-sdk');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

module.exports = pics;

const updatePic = pic => {
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      var url = getSignedUrl(pic.key, 'erica-charlie-pics-stage');
      var thmbUrl = getSignedUrl(
        `thumbnail-${pic.key}`,
        'erica-charlie-pics-thumbnails'
      );
      var ssUrl = getSignedUrl(
        `slideshow-${pic.key}`,
        'erica-charlie-pics-slideshow'
      );
      var expirationDate = Date.now() + 5 * 60000;

      db.collection('pictures').updateOne(
        {
          key: pic.key
        },
        {
          $set: {
            url,
            thmbUrl,
            ssUrl,
            expirationDate
          }
        }
      );
      resolve({
        _id: pic._id,
        key: pic.key,
        url,
        thmbUrl,
        ssUrl,
        expirationDate
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

const getSignedUrl = (Key, Bucket) => {
  return s3.getSignedUrl('getObject', {
    Bucket,
    Key,
    Expires: 300
  });
};

const savePicsToDB = (pics, albumid) => {
  const Bucket = 'erica-charlie-pics-stage';
  const expirationDate = Date.now() + 5 * 60000;
  // need to save thumbnail/slideshow key, url, expirationDate as well
  var records = pics.map(pic => {
    return {
      key: pic.name,
      url: getSignedUrl(pic.name, 'erica-charlie-pics-stage'),
      thmbKey: `thumbnail-${pic.name}`,
      thmbUrl: getSignedUrl(
        `thumbnail-${pic.name}`,
        'erica-charlie-pics-thumbnails'
      ),
      ssKey: `slideshow-${pic.name}`,
      ssUrl: getSignedUrl(
        `slideshow-${pic.name}`,
        'erica-charlie-pics-slideshow'
      ),
      expirationDate: expirationDate,
      albumid: parseInt(albumid)
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
    getAllPicsFromDB().then(resolve).catch();
  });
};

const getPicsByAlbum = albumid => {
  const getAlbumFromDB = new Promise((resolve, reject) => {
    connectToDB().then(db => {
      // get album name using albumid
      // get pics using albumName
      db
        .collection('albums')
        .find({ _id: albumid })
        .toArray(function(err, results) {
          resolve(results);
        });
    });
  });
  return new Promise((resolve, reject) => {
    getAlbumFromDB().then(updatePics).then(resolve);
  });
};

const deletePic = id => {
  return new Promise((resolve, reject) => {
    connectToDB()
      .then(db => {
        resolve(db
          .collection('pictures')
          .remove({ "_id": new ObjectId(id) }, { justOne: true })
        );
      });
  });
};

pics.get('/:albumid', (req, res) => {
  `albumid: ${req.params.albumid}`;
  getPicsByAlbum(req.params.albumid).then(pics => {
    res.status(200).json(pics);
  });
});

pics.get('/', (req, res) => {
  getAllPics().then(pics => {
    res.status(200).json(pics);
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
        Bucket: 'erica-charlie-pics-stage',
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
    const albumid = req.body._id;
    savePicsToDB(pics, albumid);
    res.status(200).json(pics);
  });
});

pics.delete('/:picid', (req, res) => {
  deletePic(req.params.picid)
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => {
      res.status(400).json(err);
    })
});
