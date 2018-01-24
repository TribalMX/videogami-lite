const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const routerVariable = require('../index.js')

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'videogami'

let documentName = null

const getCollections = (db, cb) => {
  
    // Find some documents
    db.listCollections().toArray((err, docs) => {
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
  getCollections: cb => {
    MongoClient.connect(url, (err, client) => {
      if (err) {
        return cb(err)
      }
      console.log('Connected successfully to server')

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
    console.log('Connected successfully to server')
    client.close()
  }),
}
