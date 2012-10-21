var request = require('request')
	, assert = require('assert');
var async = require('async');
var utils = require('./utils');
var self;

var create_movie = function(movie_json, callback){
	request.post({url: utils.absolute_url('/movies'), json: movie_json}, 
		function (err, response, body){
			movie_json.id = response.body.id;
			callback();
		}
	);
};
var get_movies = function(obj, callback){
	request.get({url: utils.absolute_url('/movies')}, 
		function (e, response, body){
			obj.list_response = response;
			callback();
		}
	);
};

describe('List resources', function(){
	before(function(done){
		self = this;
		self.movies = [
			{'name': 'The Matrix', 'year': 1999},
			{'name': 'Nine queens', 'year': 2000}
		]
		async.series(
			[
				async.apply(create_movie, self.movies[0]),
				async.apply(create_movie, self.movies[1]),
				async.apply(get_movies, self)
			],
			function(err, results){done();}
		);
	});
	after(function(done){
		utils.get_connection(
			function(err, db){
				require('./tear_down')(db, done);
			}
		);
	});
	describe('List resources by doing GET to /<resources>', function(){
		it('should get the list of movies', function(done){
			assert.deepEqual([self.movies[1], self.movies[0]], JSON.parse(self.list_response.body));
			done();
		});
	});
	describe('Filter resources by doing GET to /<resources>?filter with number filter', function(){
		it('should get the correct movie', function(done){
			request.get({url: utils.absolute_url('/movies?year=1999')}, 
				function (e, response, body){
					assert.deepEqual([{'id': self.movies[0].id, 'name': 'The Matrix', 'year': 1999}], JSON.parse(body));
					done();
				}
			);
		});	
	});
	describe('Filter resources by doing GET to /<resources>?filter with text filter', function(){
		it('should get the correct movie', function(done){
			request.get({url: utils.absolute_url('/movies?name=Nine%20queens')}, 
				function (e, response, body){
					assert.deepEqual([{'id': self.movies[1].id, 'name': 'Nine queens', 'year': 2000}], JSON.parse(body));
					done();
				}
			);
		});	
	});
	describe('Get not found resources', function(){
		it('should return empty []', function(done){
			request.get({url: utils.absolute_url('/not_existing_resource')}, 
				function (e, response, body){
					assert.deepEqual([], JSON.parse(body));
					assert.equal(200, response.statusCode);
					done();
				}
			);
		});	
	});
	describe('Get not found resources with default', function(){
		it('should return empty {}', function(done){
			request.get({url: utils.absolute_url('/none_existing?_default={}')}, 
				function (e, response, body){
					assert.deepEqual({}, JSON.parse(body));
					assert.equal(200, response.statusCode);
					done();
				}
			);
		});	
	});
	describe('Sort by', function(){
		it('should return results sorted', function(done){
			request.get({url: utils.absolute_url('/movies?_sort_by=year&_sort_type=asc')}, 
				function (e, response, body){
					assert.deepEqual([{'id': self.movies[0].id, 'name': 'The Matrix', 'year': 1999}, {'id': self.movies[1].id, 'name': 'Nine queens', 'year': 2000}], JSON.parse(body));
					done();
				}
			);
		});	
	});
	describe('Select_distinct', function(){
		it('should return only one field', function(done){
			request.get({url: utils.absolute_url('/movies?_select_distinct=name')}, 
				function (e, response, body){
					assert.deepEqual([{'name': 'The Matrix'}, {'name': 'Nine queens'}], JSON.parse(body));
					done();
				}
			);
		});	
	});

	
});