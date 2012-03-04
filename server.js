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

var clear_response = function(response_el){
	response_el['id'] = ""+response_el['_id'];
	delete response_el['_id'];
	delete response_el['_internal_url'];
	delete response_el['_internal_parent_url'];
}
var clean_child = function(parent_url, response_el){
	var resource_type = response_el['_internal_parent_url'].replace(parent_url+'/', '');
	clear_response(response_el);
	return {'type': resource_type, 'child': response_el};
}

var retrieve_subdomain = function(request){
	var server_host = process.env.APIDONE_HOST || 'apidone.com';
	var subdomain = process.env.APIDONE_DEFAULT_SUBDOMAIN || request.headers.host.split("."+server_host)[0];
	if(request.headers.host == "apidone.herokuapp.com" || request.headers.host == "www.apidone.com" || request.headers.host == "apidone.com"){
		subdomain = "base";
	}
	return subdomain.replace('.', '_');
};

var check_auth = function(db, request, response, ok_callback){
	db.collection('accounts', function(err, collection) {
		collection.findOne({'collection': request.subdomain}, function(error, result) {
			if(result){
				if(request.method in { POST:1, PUT:1, DELETE:1 } && result['require_key_update']){
					if(request.query['ak'] != result['key']){
						response.statusCode = 403;
						response.end('Forbidden');
						return;
					}
				}
			}
			ok_callback();
		});
	});
}

var set_cors = function(response){
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
	response.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
}

var app = module.exports = express.createServer();
configure_app(app);


mongodb.connect(create_mongodb_url(), function(err, db){

	app.all('/*', function(request, response, next) {
		request.subdomain = retrieve_subdomain(request);
		check_auth(db, request, response, function(){
			set_cors(response);
			next();
		});
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
						response.header('Location', final_url);
					    response.send({"id": id});
					}
				);
			});
		});
	});
	
	app.put('/*', function(request, response){
		db.collection(request.subdomain, function(err, collection) {
			request.body['_internal_url'] = request.route.params[0];
			delete request.body['id'];
			collection.findOne({'_internal_url': request.route.params[0]}, {'_internal_parent_url': true}, function(error, result) {
				if(result){
					request.body['_internal_parent_url'] = result['_internal_parent_url'];
					collection.update({'_internal_url': request.route.params[0]}, request.body, {'safe': true}, function(error, docs) {
						response.send();
					});
				}
			});
		});
	});
	
	app.delete('/*', function(request, response){
		db.collection(request.subdomain, function(err, collection) {
			collection.remove(
				{'$or': [{'_internal_url': request.route.params[0]}, {'_internal_parent_url': {$regex : '^'+request.route.params[0]}}]},
				{'safe': true, 'multi': true},
				function(error, docs) {
	    			response.send();
				}
			);
		});
	});

	app.get('/*', function(request, response){
		db.collection(request.subdomain, function(err, collection) {
			// Prepare conditions and selector
			var query_params = request.query;
			var selector = {};
			// Change id to _id
			if(query_params.id){
				query_params['_id'] = new mongodb.BSONPure.ObjectID(query_params.id);
				delete query_params['id'];
			}else if(query_params._select){
				// Return only some attributes
				if(typeof query_params._select == "string"){
					selector[query_params._select] = true;
				}else{
					for(var i in query_params._select){
						selector[query_params._select[i]] = true;
					}
				}
				delete query_params['_select'];
			}
			// Filter results
			for(var key in query_params){
				if(!isNaN(parseInt(query_params[key], 10))){
					query_params[key] = {'$in': [query_params[key], parseInt(query_params[key], 10)]};
				}
			}
			
			collection.findOne({'_internal_url': request.route.params[0]}, selector, function(error, result) {
				if(result){
					if(query_params._childs){
						collection.find({'_internal_parent_url': {'$regex': '^'+request.route.params[0]+'/[^/]*$'}}, function(error, cursor) {
							cursor.toArray(function(err, items) {
								if(items === null || items.lenght === 0){
								}else{
									for(var i in items){
										var one_child = clean_child(request.route.params[0], items[i]);
										if(!result[one_child['type']]){
											result[one_child['type']] = [one_child['child']];
										}else{
											result[one_child['type']].push(one_child['child']);
										}
									}
								}

								clear_response(result);
								response.send(result);
							});
						});
					}else{
						clear_response(result);
						response.send(result);
					}
				}else{
					query_params['_internal_parent_url'] = request.route.params[0];
					collection.find(query_params, selector, function(error, cursor) {
						cursor.toArray(function(err, items) {
							if(items === null || items.length === 0){
								response.send([]);

							}else{
								// Verificar si es o no es un recurso
								var output = [];
								var resource_ids = [];	
								for(var i in items){
									clear_response(items[i]);
									if (typeof items[i].resource == "undefined") {
										output.push(items[i]);
									} else {
										resource_ids.push(items[i].resource);
									}	
								}
								collection.find({'_internal_url': {'$in': resource_ids}}, function(error, cursor) {
									cursor.toArray(function(err, items) {
										if (items) {
											for(var i in items){
												clear_response(items[i]);
												output.push(items[i]);	
											}
										}
										response.send(output);
									});
								});
							}
						});
					});
				}
			});
		});
	});


});
if (!module.parent){
	app.listen(process.env.PORT || 3000);
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}
