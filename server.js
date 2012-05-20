var express = require('express');
var mongodb = require('mongodb');

var configure_app = function(app){
	app.configure(function(){
	  app.use(express.bodyParser());
	  app.use(app.router);
	});

	app.configure('development', function(){
	  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});

	app.configure('production', function(){
	  app.use(express.errorHandler());
	});
};

var retrieve_subdomain = function(request){
	var server_host = process.env.APIDONE_HOST || 'apidone.com';
	var subdomain = process.env.APIDONE_DEFAULT_SUBDOMAIN || request.headers.host.split("."+server_host)[0];
	return subdomain.replace('.', '_');
};

var clear_response = function(response_el){
	response_el['id'] = ""+response_el['_id'];
	delete response_el['_id'];
	delete response_el['_internal_url'];
	delete response_el['_internal_parent_url'];
}


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

var app = module.exports = express.createServer();
configure_app(app);

mongodb.connect(create_mongodb_url(), function(err, db){
	
	app.all('/*', function(request, response, next) {
		request.subdomain = retrieve_subdomain(request);
		next();
	});
	
	app.post('/*', function(request, response){
		db.collection(request.subdomain, function(err, collection) {
			collection.insert(request.body, {'safe': true}, function(error, docs) {
				var id = docs[0]['_id'];
				var final_url = request.route.params[0] + "/"+ id;
				collection.update({_id: id},
		        	{
						"$set": {
							'_internal_url': final_url,
							'_internal_parent_url': request.route.params[0]
						}
					},
					function(error, doc){
						response.statusCode = 201;
						response.header('Location', final_url);
					    response.send({"id": id});
					}
				);
			});
		});
	});
	
	app.get('/*', function(request, response){
		db.collection(request.subdomain, function(err, collection) {
			collection.findOne({'_internal_url': request.route.params[0]}, {}, function(error, result) {
				if(result){
					clear_response(result);
					response.send(result);
				}else{
					// odd numbers have id, so didn't found it
					if(request.route.params[0].split('/').length % 2 == 0){
						response.statusCode = 404
						response.send({});
						return;
					}
					collection.find({'_internal_parent_url': request.route.params[0]}, {}, function(error, cursor) {
						cursor.toArray(function(err, items) {
							if(items === null || items.length === 0){
								response.send([]);
							}else{
								var output = [];
								for(var i in items){
									clear_response(items[i]);
									output.push(items[i]);
								}
								response.send(output);
							}
						});
					});
				}
			});
		});
	});
	app.delete('/*', function(request, response){
		db.collection(request.subdomain, function(err, collection) {
			collection.remove({'_internal_url': request.route.params[0]}, {}, function(error, result) {
				if(result){
					response.statusCode = 204;
					response.send();
				}else{
					response.statusCode = 404;
					response.send();
				}
			});
		});
	});
});

if (!module.parent){
	app.listen(process.env.APIDONE_PORT	 || 3000);	
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}