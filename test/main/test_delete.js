var request = require('request')
	, assert = require('assert');
var async = require('async');
var utils = require('../libs/utils');
var self;

var create_movie = function(movie_json, resources_url, callback){
	request.post({url: utils.absolute_url(resources_url), json: movie_json}, 
		function (err, response, body){
			movie_json.id = response.body.id;
			callback();
		}
	);
};

describe('Delete new resource by sending DELETE to /<resources>/:resource_id', function(){
	before(function(done){
		self = this;
		self.movies = [
			{'name': 'The Matrix', 'year': 1999},
			{'name': 'Nine queens', 'year': 2000}
		]
		async.series(
			[
				async.apply(create_movie, self.movies[0], '/movies'),
				async.apply(create_movie, self.movies[1], '/movies'),
				function(callback){
					request.del({
						url: utils.absolute_url('/movies/'+self.movies[0].id)
					}, function(err, response){
						self.delete_response = response;
						done();
					});
				}
			],
			function(err, results){done();}
		);
	});
	after(function(done){
		utils.get_connection(
			function(err, db){
				require('../libs/tear_down')(db, done);
			}
		);
	});
	it('should return 204 as status code', function(done){
		assert.equal(204, self.delete_response.statusCode);
		done();
	});
	it('should not be able to get the resource', function(done){
		request.get({
			url: utils.absolute_url('/movies/'+self.movies[0].id)
		}, function(err, response, body){
			assert.deepEqual([], JSON.parse(body));
			done();
		});
	});

});

describe('Delete all new resource by sending DELETE to /<resources>', function(){
	before(function(done){
		self = this;
		self.movies = [
			{'name': 'The Matrix', 'year': 1999},
			{'name': 'Nine queens', 'year': 2000}
		]
		async.series(
			[
				async.apply(create_movie, self.movies[0], '/movies'),
				async.apply(create_movie, self.movies[1], '/movies'),
				function(callback){
					request.del({
						url: utils.absolute_url('/movies?_remove=all')
					}, function(err, response){
						self.delete_response = response;
						done();
					});
				}
			],
			function(err, results){done();}
		);
	});
	after(function(done){
		utils.get_connection(
			function(err, db){
				require('../libs/tear_down')(db, done);
			}
		);
	});
	it('should return 204 as status code', function(done){
		assert.equal(204, self.delete_response.statusCode);
		done();
	});
	it('should not be able to get the resource', function(done){
		request.get({
			url: utils.absolute_url('/movies')
		}, function(err, response){
			assert.equal('[]', response.body);
			done();
		});
	});

});

describe('Delete new resource by sending DELETE to /<resources>/:resource_id when created in /<resources>/ (with final slash)', function(){
	before(function(done){
		self = this;
		self.movies = [
			{'name': 'The Matrix', 'year': 1999},
			{'name': 'Nine queens', 'year': 2000}
		]
		async.series(
			[
				async.apply(create_movie, self.movies[0], '/movies/'),
				async.apply(create_movie, self.movies[1], '/movies/'),
				function(callback){
					request.del({
						url: utils.absolute_url('/movies/'+self.movies[0].id)
					}, function(err, response){
						self.delete_response = response;
						done();
					});
				}
			],
			function(err, results){done();}
		);
	});
	after(function(done){
		utils.get_connection(
			function(err, db){
				require('../libs/tear_down')(db, done);
			}
		);
	});
	it('should return 204 as status code', function(done){
		assert.equal(204, self.delete_response.statusCode);
		done();
	});
	it('should not be able to get the resource', function(done){
		request.get({
			url: utils.absolute_url('/movies/')
		}, function(err, response, body){
			assert.equal(1, JSON.parse(body).length);
			done();
		});
	});

});