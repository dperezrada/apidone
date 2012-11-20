var request = require('request')
	, assert = require('assert')
	, utils = require('../libs/utils');

var self;
describe('Succesfully registered', function(){
	before(function(done){
		self = this;
		done();
	});
	after(function(done){
		require('../libs/tear_down')(self.db, done);
	});
   	it('should return 201 after creating account', function(done){
   		utils.get_connection(
			function(err, db){
				self.db = db;
				request.post(
					{
						url: utils.absolute_url('/accounts', 'admin'),
						json: {
							email: "testing@hola.com", 
							pass: "1234",
							subdomain: "1234567"
						}
					},
					function (err, response, body){
						assert.equal(201, response.statusCode);
						assert.equal("1234567", body.id);
						done();
					}
				);
			}
		);
	});
});