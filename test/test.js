
/**
 * Module dependencies.
 */

var tobi = require('tobi')
  , express = require('express')
  , should = require('should');
// Test app

var app = require('../server')
  , browser = tobi.createBrowser(app);

exports['test delete'] = function(done){
	browser.delete('/countries', function(res, obj){
		browser.delete('/dentists', function(res, obj){
			browser.delete('/patients', function(res, obj){
				done();
			});
		});
	});
};

// exports['test list'] = function(done){
// 	browser.get('/countries', function(res, obj){
// 		res.body.should.eql([]);
// 		browser.post('/countries', {body: '{"name": "Chile"}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
// 			var created_id = res.body['id'];
// 			browser.get('/countries', function(res, obj){
				
// 				// ASSERTS
// 				res.body.should.have.lengthOf(1);
// 				res.body.should.eql([{"id": created_id, "name": "Chile"}]);
				
// 				// TEAR DOWN
// 				browser.delete('/countries/'+created_id, function(res, obj){
// 	    			done();
// 				});
// 			});
// 		});
//   	});
// };

// exports['test list_with_filters'] = function(done){
// 	browser.get('/countries', function(res, obj){
// 		res.body.should.eql([]);
// 		browser.post('/countries', {body: '{"name": "Chile", "population": 17248450}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
// 			var created_id = res.body['id'];
// 			browser.get('/countries?name=Chile', function(res, obj){

// 				// ASSERTS
// 				res.body.should.have.lengthOf(1);
			
// 				browser.get('/countries?name=Peru', function(res, obj){

// 					// ASSERTS
// 					res.body.should.have.lengthOf(0);

// 					browser.get('/countries?population=17248450', function(res, obj){
// 						// ASSERTS
// 						res.body.should.have.lengthOf(1);

// 						// TEAR DOWN
// 						browser.delete('/countries/'+created_id, function(res, obj){
// 			    			done();
// 						});
// 					});	
// 				});					
// 			});
// 		});
//   	});
// };

// exports['test list_select_some_values'] = function(done){
// 	browser.get('/countries', function(res, obj){
// 		res.body.should.eql([]);
// 		browser.post('/countries', {body: '{"name": "Chile", "capital": "Santiago", "national_language": "spanish", "population": 17248450 }', headers: {'Content-Type': 'application/json'}}, function(res, obj){
// 			var created_id = res.body['id'];
// 			browser.get('/countries?name=Chile&_select=name&_select=national_language', function(res, obj){

// 				// ASSERTS
// 				res.body.should.have.lengthOf(1);
// 				res.body.should.eql([{"id": created_id, "name": "Chile", "national_language": "spanish"}]);

// 				// TEAR DOWN
// 				browser.delete('/countries/'+created_id, function(res, obj){
// 	    			done();
// 				});
// 			});
// 		});
//   	});
// };

// exports['test get_one'] = function(done){
// 	browser.get('/countries', function(res, obj){
// 		res.body.should.eql([]);
// 		browser.post('/countries', {body: '{"name": "Chile", "capital": "Santiago"}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
// 			var created_id = res.body['id'];
// 			browser.get('/countries/'+created_id, function(res, obj){
// 				// ASSERTS
// 				res.body.should.eql({"id": created_id, "name": "Chile", "capital": "Santiago"});
// 				// TEAR DOWN
// 				browser.delete('/countries/'+created_id, function(res, obj){
// 	    			done();
// 				});
// 			});
// 		});
//   	});
// };

// exports['test show_resource_with_posible_lists'] = function(done){
// 	browser.get('/countries', function(res, obj){
// 		res.body.should.eql([]);
// 		browser.post('/countries', {body: '{"name": "Chile", "capital": "Santiago"}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
// 			var created_id = res.body['id'];
// 			browser.post('/countries/'+created_id+'/cities', {body: '{"name": "Valparaiso"}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
// 				var child_created_id = res.body['id'];
// 				browser.get('/countries/'+created_id+"?_childs=true", function(res, obj){

// 					// ASSERTS
// 					res.body.should.eql({"id": created_id, "name": "Chile", "capital": "Santiago", "cities": [{"id": child_created_id, "name": "Valparaiso"}]});

// 					// TEAR DOWN
// 					browser.delete('/countries/'+created_id, function(res, obj){
// 		    			done();
// 					});
// 				});
// 			});
// 		});
//   	});
// };


exports['test relate_resources'] = function(done){
	browser.get('/dentists', function(res, obj){
		res.body.should.eql([]);
		browser.post('/dentists', {body: '{"name": "Dr. Juan Perez"}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
			var dentist_id = res.body['id'];
			browser.post('/patients', {body: '{"name": "Pedro Pablo"}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
				var patient_id = res.body['id'];
				browser.post('/dentists/'+dentist_id+"/patients", {body: '{"resource": "patients/'+patient_id+'"}', headers: {'Content-Type': 'application/json'}}, function(res, obj){
					browser.get('/dentists/'+dentist_id+"/patients", function(res, obj){
						
						res.body.should.eql({"id": patient_id, "name": "Pedro Pablo"});

						// TEAR DOWN
						browser.delete('/dentists', function(res, obj){
							browser.delete('/patients', function(res, obj){
		    					done();
		    				});
						});
					});
				});
			});
		});
  	});
};



exports.after = function(){
	app.close();
};