var express = require('express');
var mongodb = require('mongodb');
var async = require('async');
var _ = require('underscore');

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
	var subdomain = process.env.APIDONE_DEFAULT_SUBDOMAIN || 
		request.headers.host.split("."+server_host)[0];
	return subdomain.replace('.', '_');
};

var retrieve_collection = function(request){
	var subdomain = retrieve_subdomain(request);
	var base_resource = request.route.params[0].split('/')[0];
	if(base_resource == '__resources') base_resource = '';
	return subdomain+'___'+base_resource;
}

var clear_response = function(response_el){
	response_el['id'] = ""+response_el['_id'];
	delete response_el['_id'];
	delete response_el['_internal_url'];
	delete response_el['_internal_parent_url'];
	delete response_el['_internal_parent_resource'];
}


var create_mongodb_url = function(){
	var mongodb_host = process.env.MONGODB_HOST || 'localhost';
	var mongodb_port = process.env.MONGODB_PORT || 27017;
	var mongodb_dbname = process.env.MONGODB_DBNAME || 'apidone_dev';
	if(process.env.MONGODB_USER){
		return "mongodb://" + process.env.MONGODB_USER + ":" + 
			process.env.MONGODB_PASSWORD + "@" + mongodb_host + ":" + 
			mongodb_port + "/" + mongodb_dbname;
	}else{
		return "mongodb://" + mongodb_host + ":" + mongodb_port + "/" + 
			mongodb_dbname;
	}
}

var set_cors = function(response){
	response.header("Access-Control-Allow-Origin", "*");
	response.header(
		"Access-Control-Allow-Headers",
		"X-Requested-With,Content-Type"
	);
	response.header("Access-Control-Allow-Methods", "OPTIONS,GET,HEAD,POST,PUT,DELETE");
}


var app = module.exports = express.createServer();
configure_app(app);

var Mongo = {
	get_collection: function(db, name, callback){
		db.collection(name, callback);
	},
	insert: function(collection, data, callback){
		collection.insert(data, {'safe': true}, callback);
	},
	update_internal_url: function(parent_url, id, collection, callback){
		var final_url = parent_url + "/"+ id;
		var splited_url = parent_url.split('/')
		var resource = splited_url[splited_url.length -1]
		collection.update({_id: id},
        	{
				"$set": {
					'_internal_url': final_url,
					'_internal_parent_url': parent_url,
					'_internal_parent_resource': resource
				}
			},
			function(error, doc){
				callback(error, final_url, id);
			}
		);
	},
	update: function(collection, selector, query, callback){
		collection.update(selector, query, callback)
	},
	get_collections: function(db, subdomain, callback){
		db.collectionNames(function(err, collections){
			var collections_return = []
			var db_name = process.env.MONGODB_DBNAME || 'apidone_dev';
			var collection = subdomain+'___';
			var collection_start = db_name+"."+collection
			for (var i = collections.length - 1; i >= 0; i--){
				if(collections[i]['name'].indexOf(collection_start) == 0){
					collections_return.push(
						{'name': collections[i]['name'].replace(collection_start, '')}
					);
				}
			};
			callback(err, collections_return);
		})
	}
};

mongodb.connect(create_mongodb_url(), function(err, db){
	
	app.all('/*', function(request, response, next) {
		request.collection = retrieve_collection(request);
		set_cors(response);
		next();
	});
	
	app.post('/*', function(request, response){
		async.waterfall(
			[
				async.apply(Mongo.get_collection, db, request.collection),
				function(collection, callback){
					Mongo.insert(
						collection, request.body, function(err, inserted_docs){
							callback(err, inserted_docs[0]['_id'], collection);
						}
					);
				},
				async.apply(Mongo.update_internal_url, request.route.params[0]),
			],
			function(err, final_url, id){
				if(err){
					console.error(err);
					response.statusCode = 503;
					response.send('Internal Server Error')
				}else{
					response.statusCode = 201;
					response.header('Location', final_url);
			    	response.send({"id": id});
				}
			}
		);
	});
	
	var prepare_db_filters = function(query_string){
		var filters = query_string;
		if(filters.id){
			filters['_id'] = new mongodb.BSONPure.ObjectID(query_params.id);
			delete filters['id'];
		}
		// Search for numbers as string and integer
		for(var key in filters){
			if(!isNaN(parseInt(filters[key], 10))){
				filters[key] = {'$in': [filters[key], parseInt(filters[key], 10)]};
			}
		}
		return filters;
	}
	
	app.get('/*', function(request, response){
		if(request.route.params[0] == '__resources'){
			Mongo.get_collections(db, retrieve_subdomain(request),
				function(err, collections){

					response.send(collections);
				}
			);
		}else{
			db.collection(request.collection, function(err, collection) {
				if(request.route.params[0].indexOf('__resources')>0){
					var internal_parent_url = request.route.params[0].replace('/__resources', '')
					collection.distinct('_internal_parent_resource', {
						'_internal_parent_url': {$regex : '^'+internal_parent_url+'/[^\/]+$'}
					}, function(error, resources){
						response.send(_.map(resources, function(resource){ return {'name': resource}}));
					});
				}else{
					collection.findOne({'_internal_url': request.route.params[0]}, {}, 
						function(error, result) {
							if(result){
								clear_response(result);
								response.send(result);
							}else{
								var filters = prepare_db_filters(request.query);
								filters['_internal_parent_url'] = request.route.params[0];
								collection.find(filters, {}, function(error, cursor){
									cursor.toArray(function(err, items) {
										if(items === null || items.length === 0){
											// odd numbers have id, so didn't found it
											if(request.route.params[0].split('/').length % 2 == 0){
												response.statusCode = 404
												response.send({});
												return;
											}else{
												response.send([]);
											}
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
						}
					);
				}
			});
		}
	});
	app.delete('/*', function(request, response){
		db.collection(request.collection, function(err, collection) {
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
	
	app.put('/*', function(request, response){
		db.collection(request.collection, function(err, collection) {
			collection.findOne({'_internal_url': request.route.params[0]}, {}, function(error, resource) {
				if(resource){
					request.body['_internal_url'] = resource['_internal_url'];
					request.body['_internal_parent_url'] = resource['_internal_parent_url'];
					request.body['_internal_parent_resource'] = resource['_internal_parent_resource'];
					if(request.body['id']){
						delete request.body['id'];
					}
					collection.update({'_internal_url': request.route.params[0]}, request.body, function(error, result) {
						response.statusCode = 204;
						response.send();
					});
				}else{
					// TODO: CREATE
					response.statusCode = 404;
					response.send();
				}
			});
		});
	});

});

if (!module.parent){
	app.listen(process.env.PORT	 || 3000);	
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}