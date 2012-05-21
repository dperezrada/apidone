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

describe('Get new resource when GET to /<resources>/:resource_id', function(){
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
 		require('./tear_down')(done);
	});
	it('should get the correct movie', function(done){
		assert.deepEqual(self.movies, JSON.parse(self.list_response.body));
		done();
	});
});