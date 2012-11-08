var async = require('async');

module.exports = function(db, callback){
	db.collectionNames(function(err, collections){
		async.forEach(['test___movies', 'test___countries'], function(collection_name, callback1){
			db.collection(collection_name, function(err, collection) {
				collection.remove({}, function(err, done) {
					callback1();
				});
			});
		}, callback);
	});
};