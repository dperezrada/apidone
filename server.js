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
	var mongodb_dbname = process.env.MONGODB_DBNAME || 'apidone_test';
	if(process.env.MONGODB_USER){
		return "mongodb://" + process.env.MONGODB_USER + ":" + process.env.MONGODB_PASSWORD + "@" + mongodb_host + ":" + mongodb_port + "/" + mongodb_dbname;
	}else{
		return "mongodb://" + mongodb_host + ":" + mongodb_port + "/" + mongodb_dbname;
	}
}

var app = module.exports = express.createServer();
configure_app(app);

var clear_response = function(response_el){
	response_el['id'] = ""+response_el['_id'];
	delete response_el['_id'];
	delete response_el['_internal_url'];
	delete response_el['_internal_parent_url'];
}

mongodb.connect(create_mongodb_url(), function(err, db){
    db.collection('data', function(err, collection) {
		app.all('/*', function(req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
			res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
			next();
		});
		app.get('/*', function(request, response){
			// Prepare conditions and selector
			var query_params = request.query;
			var selector = {};
			if(query_params.id){
				query_params['_id'] = new mongodb.BSONPure.ObjectID(query_params.id);
				delete query_params['id'];
			}else if(query_params._select){
				if(typeof query_params._select == "string"){
					selector[query_params._select] = true;
				}else{
					for(var i in query_params._select){
						selector[query_params._select[i]] = true;
					}
				}
				delete query_params['_select'];
			}
			for(var key in query_params){
				if(!isNaN(parseInt(query_params[key], 10))){
					query_params[key] = {'$in': [query_params[key], parseInt(query_params[key], 10)]};
				}
			}
			
			query_params['_internal_parent_url'] = request.route.params[0];
			
			collection.findOne({'_internal_url': request.route.params[0]}, selector, function(error, result) {
				if(result){
					clear_response(result);
					response.send(result);
				}else{				
					collection.find(query_params, selector, function(error, cursor) {
						cursor.toArray(function(err, items) {
							if(items === null || items.lenght === 0){
								response.send([]);
							}else{
								for(var i in items){
									clear_response(items[i]);
								}
								response.send(items);
							}
						});
					});
				}
			});
		});
		
		app.post('/*', function(request, response){
			collection.insert(request.body, {'safe': true}, function(error, docs) {
				var id = docs[0]['_id'];
				var final_url = request.route.params[0] + "/"+ id
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
				)
			});
		});
		
		app.put('/*', function(request, response){
			request.body['_internal_url'] = request.route.params[0];
			delete request.body['id'];
			collection.update({'_internal_url': request.route.params[0]}, request.body, {'safe': true}, function(error, docs) {
				response.send();
			});
		});
		
		app.delete('/*', function(request, response){
			collection.remove({'$or': [{'_internal_url': request.route.params[0]}, {'_internal_parent_url': {$regex : '^'+request.route.params[0]}}]}, {'safe': true, 'multi': true}, function(error, docs) {
			    response.send();
			});
		});
	});
});
if (!module.parent){
	app.listen(process.env.PORT || 3000);
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}
