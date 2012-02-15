
/**
 * Module dependencies.
 */

var tobi = require('tobi')
  , express = require('express')
  , should = require('should');
// Test app

var app = require('../server')
  , browser = tobi.createBrowser(app);

exports['test list'] = function(done){
	browser.get('/countries', function(res, obj){
		res.body.should.eql([]);
		browser.post('/countries', {body: '{"name": "Chile"}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
			browser.get('/countries', function(res, obj){
				var created_id = res.body[0]['id'];
				delete res.body[0]['id']
				
				// ASSERTS
				res.body.should.have.lengthOf(1);
				res.body.should.eql([{"name": "Chile"}]);
				
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
		browser.post('/countries', {body: '{"name": "Chile"}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
			browser.get('/countries?name=Chile', function(res, obj){
				var created_id = res.body[0]['id'];

				// ASSERTS
				res.body.should.have.lengthOf(1);
			
				browser.get('/countries?name=Peru', function(res, obj){

					// ASSERTS
					res.body.should.have.lengthOf(0);

					// TEAR DOWN
					browser.delete('/countries/'+created_id, function(res, obj){
		    			done();
					});
				});	
			});
		});
  	});
};



exports.after = function(){
	app.close();
};