var request = require('request');
var assert = require('assert');
var _ = require('underscore');
var async = require('async');
var utils = require('./libs/utils');

var self;

var create_movie = function(obj, return_callback){
	request.post({url: utils.absolute_url('/movies'), json: obj},
		function (err, response, body){
			obj.movie_id = response.body.id;
			return_callback();
		}
	);
};

var update_movie = function(obj, movie_json, return_callback){
	console.log(utils.absolute_url('/movies/'+obj.movie_id));
	request.patch({url: utils.absolute_url('/movies/'+obj.movie_id), json: movie_json},
		function (err, response, body){
			obj.update_response = response;
			return_callback();
		}
	);
};

describe('Replace resource by sending PATCH to /<resources>/:resource_id', function(){
	before(function(done){
		self = {name: 'The Matrix', year: 1998};
		async.series([
			async.apply(create_movie, self),
			async.apply(update_movie, self, {'year': 1999})
		],
		function(){
			done();
		})
	});
	after(function(done){
		utils.get_connection(
			function(err, db){
				require('./libs/tear_down')(db, done);
			}
		);
	});
   	it('should return 204 after updating a resource', function(done){
		assert.equal(204, self.update_response.statusCode);
		done();
	});
	it('should be able to get the updated resource', function(done){
		request.get({url: utils.absolute_url('/movies/'+self.movie_id)}, function(err, response){
			assert.deepEqual(
				{'id': self.movie_id, 'name': 'The Matrix', 'year': 1999},
				JSON.parse(response.body)
			);
			done();
		});
	});
});


describe('Parallel update', function(){
	before(function(done){
		movies = [
			{id:1, 'name': 'The Matrix I', 'year': 1998, 'language': 'english 1'},
			{id:2, 'name': 'The Matrix II', 'year': 1998, 'language': 'english 2'},
			{id:3, 'name': 'The Matrix III', 'year': 1998, 'language': 'english 3'},
			{id:4, 'name': 'The Matrix IV', 'year': 1998, 'language': 'english 4'},
			{id:5, 'name': 'The Matrix V', 'year': 1998, 'language': 'english 5'},
			{id:6, 'name': 'The Matrix VI', 'year': 1998, 'language': 'english 6'},
			{id:7, 'name': 'The Matrix VII', 'year': 1998, 'language': 'english 7'}
		];
		async.series([
			function(callback){
				async.series(
					[
						async.apply(create_movie, movies[0]),
						async.apply(create_movie, movies[1]),
						async.apply(create_movie, movies[2]),
						async.apply(create_movie, movies[3]),
						async.apply(create_movie, movies[4]),
						async.apply(create_movie, movies[5]),
						async.apply(create_movie, movies[6]),
					],
					function(err, results) {
						callback(null, []);
					}
				);
			},
			function(callback){
				async.parallel(
					[
						async.apply(update_movie, movies[0], {'year': 1999}),
						async.apply(update_movie, movies[1], {'year': 1999}),
						async.apply(update_movie, movies[2], {'year': 1999}),
						async.apply(update_movie, movies[3], {'year': 1999}),
						async.apply(update_movie, movies[4], {'year': 1999}),
						async.apply(update_movie, movies[5], {'year': 1999}),
						async.apply(update_movie, movies[6], {'year': 1999}),

					],
					function(err, results) {
						callback(null, null);
					}
				);
			}
		],
		function(){
			done();
		});
	});
	after(function(done){
		utils.get_connection(
			function(err, db){
				require('./libs/tear_down')(db, done);
			}
		);
	});
	it('should return 204 after updating a resource', function(done){
		request.get({url: utils.absolute_url('/movies/')},
			function (err, response, body){
				var json_response = JSON.parse(response.body);
				assert.deepEqual(
					_.findWhere(json_response, {'id': "1"}),
					{'id': '1', 'name': 'The Matrix I', 'year': 1999, 'language': 'english 1'}
				);
				assert.deepEqual(
					_.findWhere(json_response, {'id': "2"}),
					{'id': '2', 'name': 'The Matrix II', 'year': 1999, 'language': 'english 2'}
				);
				done();
			}
		);
	});
});

