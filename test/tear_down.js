var mongodb = require('mongodb');
// TODO: REFACTOR
var create_mongodb_url = function(){
	var mongodb_host = process.env.MONGODB_HOST || 'localhost';
	var mongodb_port = process.env.MONGODB_PORT || 27017;
	var mongodb_dbname = process.env.MONGODB_DBNAME || 'apidone_dev';
	if(process.env.MONGODB_USER){
		return "mongodb://" + process.env.MONGODB_USER + ":" + process.env.MONGODB_PASSWORD + "@" + mongodb_host + ":" + mongodb_port + "/" + mongodb_dbname;
	}else{
		return "mongodb://" + mongodb_host + ":" + mongodb_port + "/" + mongodb_dbname;
	}
}

module.exports = function(callback){
	mongodb.connect(create_mongodb_url(), function(err, db){
		db.collection(process.env.APIDONE_DEFAULT_SUBDOMAIN, function(err, collection) {
			collection.remove({}, function(err, done) {
				callback();
			});
		});
	});
};