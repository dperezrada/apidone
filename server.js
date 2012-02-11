var express = require('express');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;

var configure_app = function(app){
	app.configure(function(){
	  app.use(express.bodyParser());
	  app.use(express.methodOverride());
	  app.use(app.router);
	});

	app.configure('development', function(){
	  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});

	app.configure('production', function(){
	  app.use(express.errorHandler());
	});
};

var connect_to_mongo = function(){
	var mongodb_host = 'localhost';
	var mongodb_port = Connection.DEFAULT_PORT;
	console.log("Connecting to " + mongodb_host + ":" + mongodb_port);
	return new Db('apidone', new Server(mongodb_host, mongodb_port, {}), {native_parser:false});
}

var app = module.exports = express.createServer();
configure_app(app);

var db = connect_to_mongo();

var clear_response = function(response_el){
	response_el['id'] = ""+response_el['_id'];
	delete response_el['_id'];
	delete response_el['_internal_url'];
	delete response_el['_internal_parent_url'];
}

db.open(function(err, db) {
    db.collection('data', function(err, collection) {
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
			collection.insert(request.body, function(error, docs) {
				var id = docs[0]['_id'];
				var final_url = request.url + "/"+ id
				collection.update({_id: id},
		        	{
						"$push": {
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
			collection.update({'_internal_url': request.url}, request.body , function(error, docs) {
				response.send();
			});
		});
		
		app.delete('/*', function(request, response){
			collection.remove({'_internal_url': request.url}, function(error, docs) {
			    response.send();
			});
		});
	});
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);