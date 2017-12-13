const albums = require('express').Router();
const util = require('util');
var MongoClient = require('mongodb').MongoClient;
var AWS = require('aws-sdk');

module.exports = albums;

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


const updatePic = (pic) => {
  return new Promise((resolve, reject) => {
    console.log('updating pic: ', pic);
    var url = getSignedUrl(pic._id, 'erica-charlie-pics-stage');
    connectToDB().then(db => {
      var url = getSignedUrl(pic._id, 'erica-charlie-pics-stage');
      var thmbUrl = getSignedUrl(
        `thumbnail-${pic._id}`,
        'erica-charlie-pics-thumbnails'
      );
      var ssUrl = getSignedUrl(
        `slideshow-${pic._id}`,
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

const updatePics = (pics) => {
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
const getPicsByAlbum = albumid => {
  const getPics = () => new Promise((resolve, reject) => {
    connectToDB().then(db => {
      // get album name using albumid
      // get pics using albumName
      db
        .collection('pictures')
        .find({ albumid: parseInt(albumid) })
        .toArray(function(err, results) {
          resolve(results);
        });
    });
  });
  return new Promise((resolve, reject) => {
    getPics().then(updatePics).then(resolve);
  })
};
const deleteThumbnail = id => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: 'erica-charlie-pics-thumbnails',
      Key: `thumbnail-${id}`,
    }
    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.log('error: ', err);
      } else {
        resolve(data);
      }
    });
  });
};

const deleteSlideshowPic = id => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: 'erica-charlie-pics-slideshow',
      Key: `slideshow-${id}`,
    }
    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.log('error: ', err);
      } else {
        resolve(data);
      }
    });
  });
};

const deleteFullSizedPic = id => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: 'erica-charlie-pics-stage',
      Key: id,
    }
    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.log('error: ', err);
      } else {
        resolve(data);
      }
    });
  });
};

const deletePicFromS3 = id => {
  return new Promise((resolve, reject) => {
    Promise.all([deleteFullSizedPic(id), deleteThumbnail(id), deleteSlideshowPic(id)])
      .then(resolve)
  });
};

const deletePic = id => {
  return new Promise((resolve, reject) => {
    connectToDB()
      .then(db => {
        db
          .collection('pictures')
          .remove({ "_id": id }, { justOne: true })
        deletePicFromS3(id)
          .then(resolve);

      });
  });
};

const deleteAlbum = albumId => {
  return new Promise((resolve, reject) => {
    connectToDB()
      .then(db => {
        db
          .collection('albums')
          .remove({ "_id": parseInt(albumId) })
        resolve();
      })
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
      db
        .collection('albums')
        .find({ _id: parseInt(_id) })
        .toArray(function(err, record) {
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

const deleteAlbumPics = albumId => {
  return new Promise((resolve, reject) => {
    connectToDB()
      .then(db => {
        db.collection('pictures')
          .find({ "albumid": parseInt(albumId) })
          .toArray(function(err, results) {
            const promises = results.map((pic) => deletePic(pic._id));
            Promise.all(promises)
              .then(() => {
                resolve(results);
              })
          })
      })
  });
};

const updateAlbumPics = albumId => {
  return new Promise((resolve, reject) => {
    connectToDB()
      .then(db => {
        db.collection('pictures')
          .updateMany(
            {
              "albumid": parseInt(albumId)
            },
            {
              $set: { "albumid": null }
            }
          )
        resolve();
      });
  });
}

albums.post('/', (req, res) => {
  const albumName = req.body.name;
  saveNewAlbum(albumName).then(results => {
    res.status(200).json({ message: 'album created' });
  });
});

albums.get('/:albumid', (req, res) => {
  getPicsByAlbum(req.params.albumid).then(pics => {
    res.status(200).json(pics);
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

albums.delete('/', (req, res) => {
  const albumId = req.query.id;
  const deletePics = req.query.deletePics;

  deleteAlbum(albumId)
    .then(() => {
      if (deletePics) {
        deleteAlbumPics(albumId)
          .then(pics => {
            res.status(200).json({
              message: `Successfully deleted album: ${albumId}`,
              deletedPics: pics
            })
          })
      } else {
        updateAlbumPics(albumId)
          .then(() => {
            res.status(200).json({
              message: `Successfully deleted album: ${albumId}, no pics deleted`
            })
          })
      }
    });
});
