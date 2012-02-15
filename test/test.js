
/**
 * Module dependencies.
 */

var tobi = require('tobi')
  , express = require('express')
  , should = require('should');
// Test app

var app = require('../server')
  , browser = tobi.createBrowser(app);

exports['test delete'] = function(done){
	browser.delete('/countries', function(res, obj){
		done();
	});
};

exports['test list'] = function(done){
	browser.get('/countries', function(res, obj){
		res.body.should.eql([]);
		browser.post('/countries', {body: '{"name": "Chile"}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
			var created_id = res.body['id'];
			browser.get('/countries', function(res, obj){
				
				// ASSERTS
				res.body.should.have.lengthOf(1);
				res.body.should.eql([{"id": created_id, "name": "Chile"}]);
				
				// TEAR DOWN
				browser.delete('/countries/'+created_id, function(res, obj){
	    			done();
				});
			});
		});
  	});
};

exports['test list_with_filters'] = function(done){
	browser.get('/countries', function(res, obj){
		res.body.should.eql([]);
		browser.post('/countries', {body: '{"name": "Chile", "population": 17248450}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
			var created_id = res.body['id'];
			browser.get('/countries?name=Chile', function(res, obj){

				// ASSERTS
				res.body.should.have.lengthOf(1);
			
				browser.get('/countries?name=Peru', function(res, obj){

					// ASSERTS
					res.body.should.have.lengthOf(0);

					browser.get('/countries?population=17248450', function(res, obj){
						// ASSERTS
						res.body.should.have.lengthOf(1);

						// TEAR DOWN
						browser.delete('/countries/'+created_id, function(res, obj){
			    			done();
						});
					});	
				});					
			});
		});
  	});
};

exports['test list_select_some_values'] = function(done){
	browser.get('/countries', function(res, obj){
		res.body.should.eql([]);
		browser.post('/countries', {body: '{"name": "Chile", "capital": "Santiago", "national_language": "spanish", "population": 17248450 }', headers: {'Content-Type': 'application/json'}}, function(res, obj){
			var created_id = res.body['id'];
			browser.get('/countries?name=Chile&_select=name&_select=national_language', function(res, obj){

				// ASSERTS
				res.body.should.have.lengthOf(1);
				res.body.should.eql([{"id": created_id, "name": "Chile", "national_language": "spanish"}]);

				// TEAR DOWN
				browser.delete('/countries/'+created_id, function(res, obj){
	    			done();
				});
			});
		});
  	});
};




exports.after = function(){
	app.close();
};