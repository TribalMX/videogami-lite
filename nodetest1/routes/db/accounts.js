const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const routerVariable = require('../index.js')
const mongodb = require('mongodb');

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'videogami'

const deleteStreamOutlet = function (db, callback, outletToDelete_) {
    // Get the documents collection
    const collection = db.collection('outlets')
    // Insert some documents
    collection.deleteOne({ _id: new mongodb.ObjectID(outletToDelete_.toString())}, function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        console.log("Removed the streaming outlet");
        callback(result);
      });    
    }

// Youtube outlet functions

const insertYoutube = function (db, callback, YToutletName_, YTrtmp_) {
    // Get the documents collection
    const collection = db.collection("outlets")
    // Insert some documents
    collection.insertOne(
      {YToutlets: {name: YToutletName_, YTrtmp: YTrtmp_}},
      function (err, result) {
        assert.equal(err, null)
        assert.equal(1, result.result.n)
        assert.equal(1, result.ops.length)
        console.log('Inserted a Youtube streaming info into the Streams collection')
        callback(result)
      })
  }
const findYToutlets = (db, cb) => {
    // Get the documents collection
    const collection = db.collection('outlets');
  
    // Find some documents
    collection.find({"YToutlets": { $exists: true } }).toArray((err, docs) => {
      // An error occurred we need to return that to the given 
      // callback function
      if (err) {
        return cb(err);
      }
  
      assert.equal(err, null);
      console.log("Found the following records for Youtube outlets");
      console.log(docs)
  
      return cb(null, docs);
    });
}

// Facebook outlet functions

const insertFacebook = function (db, callback, FBoutletName_, FBappId_, FBaccessToken_) {
    // Get the documents collection
    const collection = db.collection("outlets")
    // Insert some documents
    collection.insertOne(
      {FBoutlets: {name: FBoutletName_, FBaccessToken: FBaccessToken_, FBappId: FBappId_}},
      function (err, result) {
        assert.equal(err, null)
        assert.equal(1, result.result.n)
        assert.equal(1, result.ops.length)
        console.log('Inserted a Facebook streaming info into the Streams collection')
        callback(result)
    })
  }

  const findFBoutlets = (db, cb) => {
    // Get the documents collection
    const collection = db.collection('outlets');
  
    // Find some documents
    collection.find({"FBoutlets": { $exists: true } }).toArray((err, docs) => {
      // An error occurred we need to return that to the given 
      // callback function
      if (err) {
        return cb(err);
      }
  
      assert.equal(err, null);
      console.log("Found the following records for Facebook outlets");
      console.log(docs)
  
      return cb(null, docs);
    });
}

module.exports = {
    deleteStreamOutlet: (outletToDelete_) => MongoClient.connect(url, function (err, client) {
        outletForDeletion = outletToDelete_
        assert.equal(null, err)
        console.log('Connected successfully to server')
    
        const db = client.db(dbName)
    
        deleteStreamOutlet(db, function (outletForDeletion) {
          client.close()
        }, outletToDelete_)
    }),
    insertYoutubeOutlet: (YToutletName_, YTrtmp_) => MongoClient.connect(url, function (err, client) {
        assert.equal(null, err)
        console.log('Connected successfully to server')
    
        const db = client.db(dbName)
    
        insertYoutube(db, function (YToutletName, YTrtmp) {
          client.close()
        }, YToutletName_, YTrtmp_)
      }),
    findYToutlets: cb => {
        MongoClient.connect(url, (err, client) => {
            if (err) {
            return cb(err)
            }
            console.log('Connected successfully to server')

            const db = client.db(dbName)

            findYToutlets(db, (err, docs) => {
            if (err) {
                return cb(err)
            }

            // return your documents back to the given callback
            return cb(null, docs)
            })
        })
    },
    insertFacebookOutlet: (FBoutletName_, FBappId_, FBaccessToken_) => MongoClient.connect(url, function (err, client) {

        assert.equal(null, err)
        console.log('Connected successfully to server')
    
        const db = client.db(dbName)
    
        insertFacebook(db, function () {
          client.close()
        }, FBoutletName_, FBappId_, FBaccessToken_)
      }),
      findFBoutlets: cb => {
        MongoClient.connect(url, (err, client) => {
            if (err) {
            return cb(err)
            }
            console.log('Connected successfully to server')

            const db = client.db(dbName)

            findFBoutlets(db, (err, docs) => {
            if (err) {
                return cb(err)
            }

            // return your documents back to the given callback
            return cb(null, docs)
            })
        })
    },  
}
