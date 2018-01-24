const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const routerVariable = require('../index.js')

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'videogami'

let documentName = null
let labelName = null
let time = null

const insertDocument = function (db, callback) {
  // Get the documents collection
  const collection = db.collection(documentName)
  // Insert some documents
  collection.insertOne(
    {name: documentName},
    function (err, result) {
      assert.equal(err, null)
      assert.equal(1, result.result.n)
      assert.equal(1, result.ops.length)
      console.log('Inserted a document into the collection')
      callback(result)
    })
}

const insertLabel = function (db, callback) {

  // Get the documents collection
  const collection = db.collection(documentName)
  // Insert some documents
  collection.insertOne(

    {label: labelName + ": " + time},
    function (err, result) {
      assert.equal(err, null)
      assert.equal(1, result.result.n)
      assert.equal(1, result.ops.length)
      console.log('Inserted a document into the collection')
      callback(result)
    })
}

const findLabels = (db, cb) => {
  // Get the documents collection
  const collection = db.collection(documentName);

  // Find some documents
  collection.find({}, {projection:{ _id: 0, name: 0, Video_trim: 0 }}).toArray((err, docs) => {
    // An error occurred we need to return that to the given 
    // callback function
    if (err) {
      return cb(err);
    }

    assert.equal(err, null);
    console.log("Found the following records");
    console.log(docs)

    return cb(null, docs);
  });
}

module.exports = {
  // Use connect method to connect to the server insert document
  insertDoc: (docName) => MongoClient.connect(url, function (err, client) {
    documentName = docName
    assert.equal(null, err)
    console.log('Connected successfully to server')

    const db = client.db(dbName)

    insertDocument(db, function (docName) {
      client.close()
    })
  }),
  insertLabel: (labelName_, time_) => MongoClient.connect(url, function (err, client) {
    labelName = labelName_
    time = time_
    assert.equal(null, err)
    console.log('Connected successfully to server')

    const db = client.db(dbName)

    insertLabel(db, function (docName) {
      client.close()
    })
  }),
  findLabels: cb => {
    MongoClient.connect(url, (err, client) => {
      if (err) {
        return cb(err)
      }
      console.log('Connected successfully to server')

      const db = client.db(dbName)

      findLabels(db, (err, docs) => {
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
    console.log('Connected successfully to server')
    console.log('locate doc labels')
    client.close()
  })
}
