var request = require('request')
	, assert = require('assert');
var async = require('async');
var utils = require('./libs/utils');
var self;

var create_resource = function(name, data, callback){
	request.post({url: utils.absolute_url(name), json: data}, 
		function (err, response, body){
			callback(null, response.body.id);
		}
	);
};

var get_resources = function(obj, base, callback){
	request.get({url: utils.absolute_url(base+'/__resources')}, 
		function (e, response, body){
			obj.resources_list = JSON.parse(response.body);
			callback();
		}
	);
};

describe('List all resources', function(){
	before(function(done){
		self = this;
		async.series(
			[
				async.apply(create_resource,'/movies', {'name': 'The Matrix'}),
				async.apply(create_resource, '/countries', {'name': 'Chile'}),
				async.apply(get_resources, self, '')
			],
			function(err, results){
				self.results = results;
				done();
			}
		);
	});
	after(function(done){
		utils.get_connection(
			function(err, db){
				require('./libs/tear_down')(db, done);
			}
		);
	});
	it('should receive all the existing resources on GET /__resources ', function(done){
		assert.deepEqual(self.resources_list, [{name: 'countries'}, {name: 'movies'}]);
		done();
	});
	it('should receive all the existing resources on GET /countries/:id/__resources ', function(done){
		async.series(
			[
				async.apply(create_resource, '/countries/'+self.results[1]+'/people', {'name': 'Pablo Neruda'}),
				async.apply(create_resource, '/countries/'+self.results[1]+'/people', {'name': 'Gabriela Mistral'}),
				async.apply(create_resource, '/countries/'+self.results[1]+'/music_groups', {'name': 'Los Tres'}),
				async.apply(get_resources, self, '/countries/'+self.results[1])
			],
			function(err, results){
				assert.deepEqual(self.resources_list, [{name: 'people'}, {name: 'music_groups'}]);
				done();
			}
		)
	});
});