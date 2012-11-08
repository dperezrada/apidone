var request = require('request')
	, assert = require('assert');
var async = require('async');
var utils = require('./utils');
var self;

var create_movie = function(json, callback){
	request.post({url: utils.absolute_url('/movies'), json: json},
		function (err, response, body){
			callback(err, response.body.id);
		}
	);
};
var get_movie =	function(movie_id, callback){
	request.get({url: utils.absolute_url('/movies/'+movie_id)}, 
		function (e, response, body){
			callback(e, movie_id, response);
		}
	);
};

describe('Get new resource when GET to /<resources>/:resource_id', function(){
	before(function(done){
		self = this;

		async.waterfall(
			[
				async.apply(create_movie, {'name': 'The Matrix', 'year': 1999}),
				get_movie,
			],
			function(err, movie_id, response){
				self.movie_id = movie_id;
				self.response = response;
				done();
			}
		);
	});
	after(function(done){
		utils.get_connection(
			function(err, db){
				require('./tear_down')(db, done);
			}
		);
	});
	it('should get the correct movie', function(done){
		assert.deepEqual({
			'id': self.movie_id,
			'name': 'The Matrix',
			'year': 1999
		}, JSON.parse(self.response.body));
		done();
	});
});

describe('Get new resource when GET to /<resources>/:resource_id created with id', function(){
	before(function(done){
		self = this;

		async.waterfall(
			[
				async.apply(create_movie, {'id': 'machuca', 'name': 'Machuca', 'year': 2004}),
				get_movie,
			],
			function(err, movie_id, response){
				self.movie_id = movie_id;
				self.response = response;
				done();
			}
		);
	});
	after(function(done){
		utils.get_connection(
			function(err, db){
				require('./tear_down')(db, done);
			}
		);
	});
	it('should get the correct movie', function(done){
		assert.deepEqual({
			'id': 'machuca',
			'name': 'Machuca',
			'year': 2004
		}, JSON.parse(self.response.body));
		done();
	});
});	