var request = require('request')
	, assert = require('assert');
var async = require('async');
var utils = require('../libs/utils');
var self;

var create_movie = function(movie_json, callback){
	request.post({url: utils.absolute_url('/movies'), json: movie_json}, 
		function (err, response, body){
			movie_json.id = response.body.id;
			callback();
		}
	);
};

var get_url = function(url, callback){
	request.get({url: utils.absolute_url(url)}, 
		function (e, response, body){
			callback(JSON.parse(body));
		}
	);
};

describe('List resources', function(){
	before(function(done){
		self = this;
		self.movies = [
			{'name': 'The Matrix', 'year': 1999},
			{'name': 'Nine queens', 'year': 2000},
			{'name': 'Cinema Paradiso', 'year': 1988},
			{'name': 'One Flew Over the Cuckoo\'s Nest', 'year': 1975}
		]
		async.series(
			[
				async.apply(create_movie, self.movies[0]),
				async.apply(create_movie, self.movies[1]),
				async.apply(create_movie, self.movies[2]),
				async.apply(create_movie, self.movies[3]),
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
	describe('List resources with limit by doing GET to /<resources>?_limit=2', function(){
		it('should get the list of movies', function(done){
			get_url('/movies?_limit=2', function(movies){
				assert.equal(2, movies.length);
				done();
			});
		});
	});
	describe('Skip resources with by doing GET to /<resources>?_offset=2', function(){
		it('should get the list of movies', function(done){
			get_url('/movies?_limit=2&_offset=2&_sort_by=year&_sort_type=desc', function(movies){
				assert.equal(2, movies.length);
				assert.equal(1988, movies[0].year);
				assert.equal(1975, movies[1].year);
				done();
			});
		});
	});
});