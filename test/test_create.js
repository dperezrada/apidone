var request = require('request')
	, assert = require('assert')
	, utils = require('./utils');

var self;
describe('New resources when POST to /<resources>', function(){
	before(function(done){
		self = this;
		request.post({url: utils.absolute_url('/movies'), json: {'name': 'matrix', 'year': 1999}}, 
			function (err, response, body){
				self.create_response = response;
				done();
			}
		);
	});
	after(function(done){
 		require('./tear_down')(done);
	});
   	it('should return 201 after creating a new resource', function(done){
		assert.equal(201, self.create_response.statusCode);
		done();
	});
	it('should return the id after creating a new resource', function(done){;
		assert.ok(self.create_response.body.id);
		done();
	});
});