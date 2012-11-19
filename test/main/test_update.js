var request = require('request')
	, assert = require('assert')
	, async = require('async')
	, utils = require('../libs/utils');

var self;

var create_movie = function(obj, callback){
	request.post({url: utils.absolute_url('/movies'), json: {'name': 'The Matrix', 'year': 1998}},
		function (err, response, body){
			obj.movie_id = response.body.id;
			callback();
		}
	);
};

var update_movie = function(obj, movie_json, callback){
	request.put({url: utils.absolute_url('/movies/'+obj.movie_id), json: movie_json},
		function (err, response, body){
			obj.update_response = response;
			callback();
		}
	);
};

describe('Replace resource by sending PUT to /<resources>/:resource_id', function(){
	before(function(done){
		self = this;
		async.series([
			async.apply(create_movie, self),
			async.apply(update_movie, self, {'name': 'The Matrix', 'year': 1999, 'language': 'english'})
		],
		function(){
			done();
		})
	});
	after(function(done){
		utils.get_connection(
			function(err, db){
				require('../libs/tear_down')(db, done);
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
				{'id': self.movie_id, 'name': 'The Matrix', 'year': 1999, 'language': 'english'},
				JSON.parse(response.body)
			);
			done();
		});
	});
});