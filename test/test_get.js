var request = require('request')
	, assert = require('assert');
var async = require('async');
var utils = require('./utils');
var self;

var create_movie = function(obj, callback){
	request.post({url: utils.absolute_url('/movies'), json: {'name': 'The Matrix', 'year': 1999}},
		function (err, response, body){
			obj.movie_id = response.body.id;
			callback();
		}
	);
};
var get_movie =	function(obj, callback){
	request.get({url: utils.absolute_url('/movies/'+obj.movie_id)}, 
		function (e, response, body){
			obj.get_response = response;
			callback();
		}
	);
};

describe('Get new resource when GET to /<resources>/:resource_id', function(){
	before(function(done){
		self = this;
		async.series(
			[
				async.apply(create_movie, self),
				async.apply(get_movie, self),
			],
			function(err, results){done();}
		);
	});
	after(function(done){
 		require('./tear_down')(done);
	});
	it('should get the correct movie', function(done){
		assert.deepEqual({
			'id': self.movie_id,
			'name': 'The Matrix',
			'year': 1999
		}, JSON.parse(self.get_response.body));
		done();
	});
});