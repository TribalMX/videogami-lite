const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const routerVariable = require('../index.js')

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'videogami'

let logo = null

const insertLogos = function (db, callback) {
    // Get the documents collection
    const collection = db.collection("logos")
    // Insert some documents
    collection.insertOne(
      {logo: " " + logo},
      function (err, result) {
        assert.equal(err, null)
        assert.equal(1, result.result.n)
        assert.equal(1, result.ops.length)
        console.log('Inserted a document into the collection')
        callback(result)
      })
  }
const findLogos = (db, cb) => {
// Get the documents collection
const collection = db.collection("logos");

// Find some documents
collection.find({}, {projection:{ _id: 0, name: 0 }}).toArray((err, logo) => {
    // An error occurred we need to return that to the given 
    // callback function
    if (err) {
    return cb(err);
    }

    assert.equal(err, null);
    console.log("Found the following records");
    console.log(logo)

    return cb(null, logo);
});
}

module.exports = {
    insertLogo: (logo_) => MongoClient.connect(url, function (err, client) {
        logo = logo_
        assert.equal(null, err)
        console.log('Connected successfully to server')
    
        const db = client.db(dbName)
    
        insertLogos(db, function (logo_) {
          client.close()
        })
      }),
      findLogos: cb => {
        MongoClient.connect(url, (err, client) => {
          if (err) {
            return cb(err)
          }
          console.log('Connected successfully to server')
    
          const db = client.db(dbName)
    
          findLogos(db, (err, logo) => {
            if (err) {
              return cb(err)
            }
    
            // return your documents back to the given callback
            return cb(null, logo)
          })
        })
      }
}