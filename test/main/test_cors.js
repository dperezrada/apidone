var request = require('request')
	, assert = require('assert');
var async = require('async');
var utils = require('../libs/utils');
var self;

describe('Get new resource when GET to /<resources>/:resource_id', function(){
	it('should get the correct movie', function(done){
		request.get({url: utils.absolute_url('/movies')}, 
			function (e, response, body){
				assert.ok(response.headers["access-control-allow-origin"]);
				assert.ok(response.headers["access-control-allow-headers"]);
				assert.ok(response.headers["access-control-allow-methods"]);
				done();
			}
		);		
	});
});