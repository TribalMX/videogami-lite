const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const routerVariable = require('../index.js')
const fs = require('fs');
var mongodb = require('mongodb');


// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'videogami'

let documentName = null
let trimName = null
let trimToDelete = null
let startTimeInput = null
let endTimeInput = null
let trimIdToDelete = null

const insertTrim_ = function (db, callback) {

    // Get the documents collection
    const collection = db.collection(documentName)
    // Insert some documents
    collection.insertOne(
  
      {Video_trim:{trimName: trimName, startTime: startTimeInput, endTime: endTimeInput}},
      function (err, result) {
        assert.equal(err, null)
        assert.equal(1, result.result.n)
        assert.equal(1, result.ops.length)
        console.log('Inserted a document into the collection')
        callback(result)
      })
  }

  const findTrims = (db, cb) => {
    // Get the documents collection
    const collection = db.collection(documentName);
  
    // Find some documents
    collection.find({"Video_trim": { $exists: true } }, { label: 0 }).toArray((err, docs) => {
      // An error occurred we need to return that to the given 
      // callback function
      if (err) {
        return cb(err);
      }
  
      assert.equal(err, null);
      console.log("Found the following trims");
      console.log(docs)
      return cb(null, docs);
    });
  }

  const deleteTrim = function (db, callback) {
    // Get the documents collection
    const collection = db.collection(documentName)
    // Insert some documents
    collection.deleteOne({_id: new mongodb.ObjectID(trimIdToDelete.toString())}, function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        console.log("Removed the document");
        callback(result);
      });
      fs.unlink("./videos/cut-videos/" + documentName + "/" + trimToDelete + ".mp4", (err) => {
        if (err) {
            console.log("failed to delete local image:"+err);
        } else {
            console.log('successfully deleted local image');                                
        }
      });    
  }

module.exports = {
  // Use connect method to connect to the server insert document
  locateDoc: (docName) => MongoClient.connect(url, function (err, client) {
    documentName = docName
    assert.equal(null, err)
    console.log('Connected successfully to server')
    client.close()
  }),
  insertTrim: (trimName_, startTime, EndTime) => MongoClient.connect(url, function (err, client) {
    trimName = trimName_
    startTimeInput = startTime
    endTimeInput = EndTime
    assert.equal(null, err)
    console.log('Connected successfully to server')

    const db = client.db(dbName)

    insertTrim_(db, function (docName) {
      client.close()
    })
  }),
  findTrims: cb => {
    MongoClient.connect(url, (err, client) => {
      if (err) {
        return cb(err)
      }
      console.log('Connected successfully to server')

      const db = client.db(dbName)

      findTrims(db, (err, docs) => {
        if (err) {
          return cb(err)
        }
        return cb(null, docs)
      })
    })
  },
  deleteTrim: (TrimToDelete_, trimIdToDelete_) => MongoClient.connect(url, function (err, client) {
    trimToDelete = TrimToDelete_
    trimIdToDelete = trimIdToDelete_.toString()
    assert.equal(null, err)
    console.log(">>>>>" + trimIdToDelete)
    console.log('Connected successfully to server')

    const db = client.db(dbName)

    deleteTrim(db, function (trimToDelete) {
      client.close()
    })
  }) 
}