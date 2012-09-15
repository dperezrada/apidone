var request = require('request')
	, assert = require('assert')
	, utils = require('./utils')
	, mongodb = require('mongodb');

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
	it('Check collection', function(done){;
		mongodb.connect(utils.create_mongodb_url(), function(err, db){
			db.collection('test___movies', function(err, collection) {
				collection.findOne({'_internal_url': 'movies/'+self.create_response.body.id}, {}, function(error, result) {
					assert.ok(result);
					done();
				})
			});
		});
	});
});

describe('New resources when PUT to /<resources>/:id', function(){
	before(function(done){
		self = this;
		request.put({url: utils.absolute_url('/movies/custom_id'), json: {'name': 'Star Wars', 'year': 1977}}, 
			function (err, response, body){
				self.create_response = response;
				request.put({
					url: utils.absolute_url('/movies/custom_id/actors/custom_id'),
					json: {'name': 'Harrison Ford'}}, 
					function (err, response, body){
						self.create_actor_response = response;
						done();
					}
				);
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
		assert.equal('custom_id', self.create_response.body.id);
		done();
	});
	it('Check collection', function(done){;
		mongodb.connect(utils.create_mongodb_url(), function(err, db){
			db.collection('test___movies', function(err, collection) {
				collection.findOne({'_internal_url': 'movies/'+self.create_response.body.id}, {}, function(error, result) {
					assert.ok(result);
					done();
				})
			});
		});
	});
	it('Check collection', function(done){;
		mongodb.connect(utils.create_mongodb_url(), function(err, db){
			db.collection('test___movies', function(err, collection) {
				collection.findOne({'_internal_url': 'movies/custom_id/actors/'+self.create_actor_response.body.id}, {}, function(error, result) {
					assert.ok(result);
					done();
				})
			});
		});
	});
});

describe('New resources when POST to /<resources> with id', function(){
	before(function(done){
		self = this;
		request.post({url: utils.absolute_url('/movies'), json: {'id': 'super_id', 'name': 'matrix', 'year': 1999}}, 
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
	it('Check collection', function(done){;
		mongodb.connect(utils.create_mongodb_url(), function(err, db){
			db.collection('test___movies', function(err, collection) {
				collection.findOne({'_internal_url': 'movies/super_id'}, {}, function(error, result) {
					assert.ok(result);
					done();
				})
			});
		});
	});
});