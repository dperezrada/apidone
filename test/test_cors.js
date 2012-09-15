var request = require('request')
	, assert = require('assert');
var async = require('async');
var utils = require('./utils');
var self;

describe('Get new resource when GET to /<resources>/:resource_id', function(){
	it('should get the correct movie', function(done){
		request.get({url: utils.absolute_url('/movies')}, 
			function (e, response, body){
				console.log(utils.absolute_url('/movies'));
				assert.ok(response.headers["access-control-allow-origin"]);
				assert.ok(response.headers["access-control-allow-headers"]);
				assert.ok(response.headers["access-control-allow-methods"]);
				done();
			}
		);		
	});
});