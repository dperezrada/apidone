var request = require('request')
	, assert = require('assert')
	, utils = require('../libs/utils');

var self;
describe('Login with new account', function(){
	before(function(done){
		self = this;
		utils.get_connection(
			function(err, db){
				self.db = db;
				request.post(
					{
						url: utils.absolute_url('/accounts', 'admin'),
						json: {
							email: "testing@hola.com", 
							pass: "1234",
							subdomain: "12345678910"
						}
					},
					function (err, response, body){
						self.create_response = response;
						done();
					}
				);
			}
		);
	});
	after(function(done){
		require('../libs/tear_down')(self.db, done);
	});
   	it('should return 201 after creating account', function(done){
		assert.equal(201, self.create_response.statusCode);
		done();
	});
	it('should be able to login', function(done){
		request.post(
			{
				url: utils.absolute_url('/login', 'admin'),
				json: {
					email: "testing@hola.com", 
					pass: "1234"
				}
			},
			function (err, response_login, body_login){
				request.get(
					{
						url: utils.absolute_url('/subdomains', 'admin')
					},
					function (err, response_subdomains, body_subdomains){
						var json_subdomains = JSON.parse(body_subdomains)
						assert.deepEqual(["12345678910"], json_subdomains)
						done()
					}
				)
			}
		);
	});
});

describe('Invalid Login with new account', function(){
	it('shouldn\'t able to get the subdomains if Im not logged', function(done){
		request.get(
			{
				url: utils.absolute_url('/subdomains', 'admin')
			},
			function (err, response_subdomains, body_subdomains){
				assert.equal(401, response_subdomains.statusCode);
				done();
			}
		);
	});
});

describe('Shouldnt be able to create short subdomain', function(){
	it('with less than 7 chars', function(done){
		request.post(
			{
				url: utils.absolute_url('/accounts', 'admin'),
				json: {
					email: "testing1@hola.com", 
					pass: "12345",
					subdomain: "123456"
				}
			},
			function (err, response, body){
				assert.equal(409, response.statusCode);
				assert.equal('Must have length of 7 or more', body.err);
				done();
			}
		)
	});
});