var express = require('express');

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
	var mongodb_dbname = process.env.MONGODB_DBNAME || 'apidone';
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

require('mongodb').connect(create_mongodb_url(), function(err, db){
    db.collection('data', function(err, collection) {
		app.all('/*', function(req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "X-Requested-With");
			next();
		});
		app.get('/*', function(request, response){
			collection.findOne({'_internal_url': request.url}, function(error, result) {
				if(result){
					clear_response(result);
					response.send(result);
				}else{
					collection.find({'_internal_parent_url': request.url}, function(error, cursor) {
						cursor.toArray(function(err, items) {
							if(items.lenght === 0){
								response.send({"error": "Not Found"}, 404);
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
				var final_url = request.url + "/"+ id
				collection.update({_id: id},
		        	{
						"$set": {
							'_internal_url': final_url,
							'_internal_parent_url': request.url
						}
					},
					function(error, doc){
						response.header('Location', final_url);
					    response.send();
					}
				)
			});
		});
		
		app.put('/*', function(request, response){
			request.body['_internal_url'] = request.url;
			collection.update({'_internal_url': request.url}, request.body, {'safe': true}, function(error, docs) {
				response.send();
			});
		});
		
		app.delete('/*', function(request, response){
			collection.remove({'$or': [{'_internal_url': request.url}, {'_internal_parent_url': {$regex : '^'+request.url}}]}, {'safe': true, 'multi': true}, function(error, docs) {
			    response.send();
			});
		});
	});
});
app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);