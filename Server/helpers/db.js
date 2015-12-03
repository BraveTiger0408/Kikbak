var databaseURI = "mongodb://server:hushmon3y@ds039950.mongolab.com:39950/wondervid",
	collections = ["videos", "blogs", "buckets"],
	mongojs = require('mongojs'),
	db = mongojs(databaseURI, collections, { authMechanism : 'ScramSHA1' })

module.exports = db;