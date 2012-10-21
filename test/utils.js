exports.absolute_url = function(resource_url){
	return 'http://'+process.env.APIDONE_HOST+':'+process.env.APIDONE_PORT+resource_url;	
}

var mongodb = require('mongodb');
var Server = mongodb.Server,
	Db = mongodb.Db,
	BSON = mongodb.BSONPure;


exports.get_connection = function(callback){
	var MONGODB_HOST = process.env.MONGODB_HOST || "localhost";
	var MONGODB_PORT = parseInt(process.env.MONGODB_PORT || 27017);
	var MONGODB_DBNAME = process.env.MONGODB_DBNAME || "apidone_dev";
	var server = new Server(MONGODB_HOST, MONGODB_PORT, {
		auto_reconnect: true
	});
	var db = new Db(MONGODB_DBNAME, server, {
		safe: true
	});
	db.open(function(err, conn) {
		callback(err, conn);
	});
}