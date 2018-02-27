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
      // console.log("Found the following records for Youtube outlets");
      // console.log(docs)
  
      return cb(null, docs);
    });
}

// Joicaster

const insertJoicaster = function (db, callback, JCoutletName_, JCrtmp_) {
  // Get the documents collection
  const collection = db.collection("outlets")
  // Insert some documents
  collection.insertOne(
    {JCoutlets: {name: JCoutletName_, JCrtmp: JCrtmp_}},
    function (err, result) {
      assert.equal(err, null)
      assert.equal(1, result.result.n)
      assert.equal(1, result.ops.length)
      console.log('Inserted a Joicaster streaming info into the Streams collection')
      callback(result)
    })
}
const findJCoutlets = (db, cb) => {
  // Get the documents collection
  const collection = db.collection('outlets');

  // Find some documents
  collection.find({"JCoutlets": { $exists: true } }).toArray((err, docs) => {
    // An error occurred we need to return that to the given 
    // callback function
    if (err) {
      return cb(err);
    }

    assert.equal(err, null);
    console.log("Found the following records for joicaster outlets");
    // console.log(docs)

    return cb(null, docs);
  });
}

// Facebook outlet functions

const insertFacebook = function (db, callback, FBoutletName_, FBpageId_, FBaccessToken_) {
    // Get the documents collection
    const collection = db.collection("outlets")
    // Insert some documents
    collection.insertOne(
      {FBoutlets: {name: FBoutletName_, FBaccessToken: FBaccessToken_, FBpageId: FBpageId_}},
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
      // console.log("Found the following records for Facebook outlets");
      // console.log(docs)
  
      return cb(null, docs);
    });
}

// Snappy TV
const insertSnappyTV = function (db, callback, STVoutletName_, STVpublishingPoint_, STVstreamName_) {
  // Get the documents collection
  const collection = db.collection("outlets")
  // Insert some documents
  collection.insertOne(
    {STVoutlets: {name: STVoutletName_, STVpublishingPoint: STVpublishingPoint_, STVstreamName: STVstreamName_}},
    function (err, result) {
      assert.equal(err, null)
      assert.equal(1, result.result.n)
      assert.equal(1, result.ops.length)
      console.log('Inserted Snappy TV streaming info into the Streams collection')
      callback(result)
  })
}
const findSTVoutlets = (db, cb) => {
  // Get the documents collection
  const collection = db.collection('outlets');

  // Find some documents
  collection.find({"STVoutlets": { $exists: true } }).toArray((err, docs) => {
    // An error occurred we need to return that to the given 
    // callback function
    if (err) {
      return cb(err);
    }

    assert.equal(err, null);
    // console.log("Found the following records for Facebook outlets");
    console.log("Found the following records for Snappy TV" + docs)

    return cb(null, docs);
  });
}
// akamai

const insertAkamai = function (db, callback, AKoutletName_, AKrtmp_, AKurl_, AKstreamName_, AKuserNumber_, AKpassword_) {
  // Get the documents collection
  const collection = db.collection("outlets")
  // Insert some documents
  collection.insertOne(
    {AKoutlets: {name: AKoutletName_, AKrtmp: AKrtmp_, AKurl: AKurl_, AKstreamName: AKstreamName_, AKuserNumber: AKuserNumber_, AKpassword: AKpassword_}},
    function (err, result) {
      assert.equal(err, null)
      assert.equal(1, result.result.n)
      assert.equal(1, result.ops.length)
      console.log('Inserted a Akamai streaming info into the Streams collection')
      callback(result)
    })
}
const findAKoutlets = (db, cb) => {
  // Get the documents collection
  const collection = db.collection('outlets');

  // Find some documents
  collection.find({"AKoutlets": { $exists: true } }).toArray((err, docs) => {
    // An error occurred we need to return that to the given 
    // callback function
    if (err) {
      return cb(err);
    }

    assert.equal(err, null);
    // console.log("Found the following records for Youtube outlets");
    // console.log(docs)

    return cb(null, docs);
  });
}

// Custom outlet functions

const insertCustom = function (db, callback, CSoutletName_, CSrtmp_) {
  // Get the documents collection
  const collection = db.collection("outlets")
  // Insert some documents
  collection.insertOne(
    {CSoutlets: {name: CSoutletName_, CSrtmp: CSrtmp_}},
    function (err, result) {
      assert.equal(err, null)
      assert.equal(1, result.result.n)
      assert.equal(1, result.ops.length)
      console.log('Inserted a Custom streaming info into the Streams collection')
      callback(result)
    })
}
const findCSoutlets = (db, cb) => {
  // Get the documents collection
  const collection = db.collection('outlets');

  // Find some documents
  collection.find({"CSoutlets": { $exists: true } }).toArray((err, docs) => {
    // An error occurred we need to return that to the given 
    // callback function
    if (err) {
      return cb(err);
    }

    assert.equal(err, null);
    // console.log("Found the following records for Youtube outlets");
    // console.log(docs)

    return cb(null, docs);
  });
}

module.exports = {
    deleteStreamOutlet: (outletToDelete_) => MongoClient.connect(url, function (err, client) {
        outletForDeletion = outletToDelete_
        assert.equal(null, err)
        // console.log('Connected successfully to server')
    
        const db = client.db(dbName)
    
        deleteStreamOutlet(db, function (outletForDeletion) {
          client.close()
        }, outletToDelete_)
    }),
    insertYoutubeOutlet: (YToutletName_, YTrtmp_) => MongoClient.connect(url, function (err, client) {
        assert.equal(null, err)
        // console.log('Connected successfully to server')
    
        const db = client.db(dbName)
    
        insertYoutube(db, function () {
          client.close()
        }, YToutletName_, YTrtmp_)
      }),
    findYToutlets: cb => {
        MongoClient.connect(url, (err, client) => {
            if (err) {
            return cb(err)
            }
            // console.log('Connected successfully to server')

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
    insertJoicasterOutlet: (JCoutletName_, JCrtmp_) => MongoClient.connect(url, function (err, client) {
      assert.equal(null, err)
      console.log('Connected Joicaster insert successfully to server')
  
      const db = client.db(dbName)
  
      insertJoicaster(db, function () {
        client.close()
      }, JCoutletName_, JCrtmp_)
    }),
    findJCoutlets: cb => {
        MongoClient.connect(url, (err, client) => {
            if (err) {
            return cb(err)
            }
            console.log('Connected successfully to Joicaster')

            const db = client.db(dbName)

            findJCoutlets(db, (err, docs) => {
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
    insertSnappyTVOutlet: (STVoutletName_, STVpublishingPoint_, STVstreamName_) => MongoClient.connect(url, function (err, client) {

      assert.equal(null, err)
      console.log('Connected successfully to server')
  
      const db = client.db(dbName)
  
      insertSnappyTV(db, function () {
        client.close()
      }, STVoutletName_, STVpublishingPoint_, STVstreamName_)
    }),
    findSTVoutlets: cb => {
      MongoClient.connect(url, (err, client) => {
          if (err) {
          return cb(err)
          }
          console.log('Connected successfully to server')

          const db = client.db(dbName)

          findSTVoutlets(db, (err, docs) => {
          if (err) {
              return cb(err)
          }

          // return your documents back to the given callback
          return cb(null, docs)
          })
      })
    },
    insertAkamaiOutlet: (AKoutletName_, AKrtmp_, AKurl_, AKstreamName_, AKuserNumber_, AKpassword_) => MongoClient.connect(url, function (err, client) {
      assert.equal(null, err)
      // console.log('Connected successfully to server')

      const db = client.db(dbName)

      insertAkamai(db, function () {
          client.close()
      }, AKoutletName_, AKrtmp_, AKurl_, AKstreamName_, AKuserNumber_, AKpassword_)
    }),
    findAKoutlets: cb => {
        MongoClient.connect(url, (err, client) => {
            if (err) {
            return cb(err)
            }
            // console.log('Connected successfully to server')

            const db = client.db(dbName)

            findAKoutlets(db, (err, docs) => {
            if (err) {
                return cb(err)
            }

            // return your documents back to the given callback
            return cb(null, docs)
            })
        })
    },
    insertCustomOutlet: (CSoutletName_, CSrtmp_) => MongoClient.connect(url, function (err, client) {
        assert.equal(null, err)
        // console.log('Connected successfully to server')
    
        const db = client.db(dbName)
    
        insertCustom(db, function () {
          client.close()
        }, CSoutletName_, CSrtmp_)
      }),
    findCSoutlets: cb => {
        MongoClient.connect(url, (err, client) => {
            if (err) {
            return cb(err)
            }
            // console.log('Connected successfully to server')

            const db = client.db(dbName)

            findCSoutlets(db, (err, docs) => {
            if (err) {
                return cb(err)
            }

            // return your documents back to the given callback
            return cb(null, docs)
            })
        })
    }
    
}
