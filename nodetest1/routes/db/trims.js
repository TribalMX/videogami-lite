const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const routerVariable = require('../index.js')

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'videogami'

let documentName = null
let trimName = null

const insertTrim_ = function (db, callback) {

    // Get the documents collection
    const collection = db.collection(documentName)
    // Insert some documents
    collection.insertOne(
  
      {Video_trim: " " + trimName},
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
    collection.find({"Video_trim": { $exists: true } }, { _id: 0, label: 0 }).toArray((err, docs) => {
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
  const findWhole = (db, cb) => {
    // Get the documents collection
    const collection = db.collection(documentName);
  
    // Find some documents
    collection.find({"name": { $exists: true } }).toArray((err, docs) => {
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

module.exports = {
  // Use connect method to connect to the server insert document
  locateDoc: (docName) => MongoClient.connect(url, function (err, client) {
    documentName = docName
    assert.equal(null, err)
    console.log('Connected successfully to server')
    console.log('locate doc trims')
    client.close()
  }),
  insertTrim: (trimName_) => MongoClient.connect(url, function (err, client) {
    trimName = trimName_
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

        // return your documents back to the given callback
        return cb(null, docs)
      })
    })
  },
  findWhole: cb => {
    MongoClient.connect(url, (err, client) => {
      if (err) {
        return cb(err)
      }
      console.log('Connected successfully to server')

      const db = client.db(dbName)

      findWhole(db, (err, docs) => {
        if (err) {
          return cb(err)
        }

        // return your documents back to the given callback
        return cb(null, docs)
      })
    })
  }
}