const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const routerVariable = require('../index.js')
const mongodb = require('mongodb')

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'videogami'

let documentName = 'stream'
let labelName = null
let time = null
let labelToDelete = null
let labelNameToDelete = null

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

    {label: labelName + ': ' + time},
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
  const collection = db.collection(documentName)

  // Find some documents
  collection.find({'label': { $exists: true } }).toArray((err, docs) => {
    // An error occurred we need to return that to the given
    // callback function
    if (err) {
      return cb(err)
    }

    assert.equal(err, null)
    // console.log("Found the following records");
    // console.log(docs)

    return cb(null, docs)
  })
}
const deleteLabel = function (db, callback) {
  // Get the documents collection
  const collection = db.collection(documentName)
  // Insert some documents
  collection.deleteOne({ _id: new mongodb.ObjectID(labelToDelete.toString())}, function (err, result) {
    assert.equal(err, null)
    assert.equal(1, result.result.n)
    console.log('Removed the document')
    callback(result)
  })
}

const deleteLabelByName = function (db, callback) {
  // Get the documents collection
  const collection = db.collection(documentName)
  // Insert some documents
  console.log(labelNameToDelete)
  collection.deleteOne({ label: labelNameToDelete}, function (err, result) {
    assert.equal(err, null)
    assert.equal(1, result.result.n)
    console.log('Removed the document')
    callback(result)
  })
}

module.exports = {
  // Use connect method to connect to the server insert document
  insertDoc: (docName) => MongoClient.connect(url, function (err, client) {
    documentName = docName
    assert.equal(null, err)
    // console.log('Connected successfully to server')

    const db = client.db(dbName)

    insertDocument(db, function (docName) {
      client.close()
    })
  }),
  insertLabel: (labelName_, time_) => MongoClient.connect(url, function (err, client) {
    labelName = labelName_
    time = time_
    assert.equal(null, err)
    // console.log('Connected successfully to server')

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
      // console.log('Connected successfully to server')

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
    // console.log('Connected successfully to server')
    client.close()
  }),
  deleteLabel: (id) => MongoClient.connect(url, function (err, client) {
    labelToDelete = id
    assert.equal(null, err)

    const db = client.db(dbName)

    deleteLabel(db, function (labelToDelete) {
      client.close()
    })
  }),
  deleteLabelByName: (labelNameByName) => MongoClient.connect(url, function (err, client) {
    labelNameToDelete = labelNameByName
    assert.equal(null, err)

    const db = client.db(dbName)

    deleteLabelByName(db, function (labelNameToDelete) {
      client.close()
    })
  })
}
