var request = require('request')
	, assert = require('assert')
	// , _ = require('underscore')
	, mongodb = require('mongodb');

var absolute_url = function(resource_url){
	return 'http://'+process.env.APIDONE_HOST+':'+process.env.APIDONE_PORT+resource_url;	
}

describe('New resources', function(){
   	it('should return 201 after creating a new resource with POST to /<resource>', function(done){
		request.post(
				{
					url: absolute_url('/movies'),
					json: {
						'name': 'The Matrix',
						'year': 1999
					}
				}, 
				function (e, r, body){
					assert.equal(201, r.statusCode);
					done();
				}
			);
	});
});