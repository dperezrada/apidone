
/**
 * Module dependencies.
 */

var tobi = require('tobi')
  , express = require('express')
  , should = require('should');
// Test app

var app = require('../server')
  , browser = tobi.createBrowser(app);

exports['test delete_all'] = function(done){
	browser.get('/countries', function(res, obj){
		for(var i in res.body){
			browser.delete('/countries/'+res.body[i]['id'], function(res, obj){
				done();
			});
		}
  	});
}

exports['test list'] = function(done){
	browser.get('/countries', function(res, obj){
		res.body.should.eql([]);
		browser.post('/countries', {body: '{"name": "Chile"}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
			browser.get('/countries', function(res, obj){
				delete res.body[0]['id']
				res.body.should.have.lengthOf(1);
				res.body.should.eql([{"name": "Chile"}]);
	    		done();
			});
		});
  	});
};


exports.after = function(){
	app.close();
};