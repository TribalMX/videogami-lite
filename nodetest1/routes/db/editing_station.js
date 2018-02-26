const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const routerVariable = require('../index.js')
const fs = require('fs');
const rimraf = require('rimraf');

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'videogami'

let documentName = 'stream'

const getCollections = (db, cb) => {
  
    // Find some documents
    db.listCollections({name: {$nin: ['outlets', 'logos']}}).toArray((err, docs) => {
      if (err) {
        return cb(err);
      }
  
      assert.equal(err, null);
  
      return cb(null, docs);
    });
  }
  const removeCollection_ = function (db, callback) {

    // Get the documents collection
    // const collection = db.collection(documentName)
    // Insert some documents
    db.collection(documentName).drop(function(err, delOK) {
      if (err) throw err;
      if (delOK) console.log("Collection deleted");
    });
  }

module.exports = {
  getCollections: cb => {
    MongoClient.connect(url, (err, client) => {
      if (err) {
        return cb(err)
      }
      // console.log('Connected successfully to server')

      const db = client.db(dbName)

      getCollections(db, (err, docs) => {
        if (err) {
          return cb(err)
        }

        // return your documents back to the given callback
        return cb(null, docs)
      })
    })
  },
  locateDoc: (docName) => MongoClient.connect(url, function (err, client) {
    documentName = docName
    assert.equal(null, err)
    // console.log('Connected successfully to server')
    client.close()
  }),
  removeCollection: (collectionName) => MongoClient.connect(url, function (err, client) {
    const db = client.db(dbName)
    documentName = collectionName
    removeCollection_(db, function (collectionName) {
      client.close()
    })
    fs.unlink("./public/videos/output/" + collectionName + ".mp4", (err) => {
      if (err) {
          console.log("failed to delete local video:"+err);
      } else {
          console.log('successfully deleted local image');                                
      }
    })
    fs.unlink("./public/videos/screenshots/" + collectionName + ".jpg", (err) => {
      if (err) {
          console.log("failed to delete local image:"+err);
      } else {
          console.log('successfully deleted local image');                                
      }
    })
    rimraf('./public/videos/cut-videos/' + collectionName, function () { console.log('cut-videos subdirectory removed'); });
  }),
}
