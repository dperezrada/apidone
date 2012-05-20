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

describe('Delete new resource by sending DELETE to /<resources>/:resource_id', function(){
	before(function(done){
		self = this;
		self.movies = [
			{'name': 'The Matrix', 'year': 1999},
			{'name': 'Nine queens', 'year': 2000}
		]
		async.series(
			[
				async.apply(create_movie, self.movies[0]),
				async.apply(create_movie, self.movies[1])
			],
			function(err, results){done();}
		);
	});
	after(function(done){
 		require('./tear_down')(done);
	});
	it('should return 204 as status code', function(done){
		request.del({url: utils.absolute_url('/movies/'+self.movies[0].id)}, function(err, response){
			assert.equal(204, response.statusCode);
			done();
		});
	});
	it('should not be able to get the resource', function(done){
		request.get({url: utils.absolute_url('/movies/'+self.movies[0].id)}, function(err, response){
			assert.equal(404, response.statusCode);
			done();
		});
	});

});