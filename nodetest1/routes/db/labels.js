const MongoClient = require('mongodb').MongoClient
const assert = require('assert')

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'videogami'

// Use connect method to connect to the server
MongoClient.connect(url, function (err, client) {
  assert.equal(null, err)
  console.log('Connected successfully to server')

  const db = client.db(dbName)

  insertDocument(db, function () {
    client.close()
  })
})

const insertDocument = function (db, callback) {
  // Get the documents collection
  const collection = db.collection('labels')
  // Insert some documents
  collection.insertOne(
    {a: 1},
    function (err, result) {
      assert.equal(err, null)
      assert.equal(1, result.result.n)
      assert.equal(1, result.ops.length)
      console.log('Inserted a document into the collection')
      callback(result)
    })
}
