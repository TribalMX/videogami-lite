const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const routerVariable = require('../index.js')

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'videogami'

let documentName = null
let labelName = null

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
    {label: labelName},
    function (err, result) {
      assert.equal(err, null)
      assert.equal(1, result.result.n)
      assert.equal(1, result.ops.length)
      console.log('Inserted a document into the collection')
      callback(result)
    })
}

let labelsResult = null

const findLabels = function(db, callback) {
  // Get the documents collection
  const collection = db.collection(documentName);
  // Find some documents
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("Found the following records");
    // console.log(docs)
    labelsResult = docs
    console.log(labelsResult)
    callback(docs);
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
  insertLabel: (labelName_) => MongoClient.connect(url, function (err, client) {
    labelName = labelName_
    assert.equal(null, err)
    console.log('Connected successfully to server')

    const db = client.db(dbName)

    insertLabel(db, function (docName) {
      client.close()
    })
  }),
  findLabels: () => MongoClient.connect(url, function (err, client) {
    assert.equal(null, err)
    console.log('Connected successfully to server')

    const db = client.db(dbName)

    findLabels(db, function () {
      client.close()
    })
  }),
  label: labelsResult
}
