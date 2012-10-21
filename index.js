apidone = {}
apidone.controllers = {}
apidone.controllers.all = require('./lib/controllers/all');
apidone.controllers.get = require('./lib/controllers/get');
apidone.controllers.post = require('./lib/controllers/post');
apidone.controllers.put = require('./lib/controllers/put');
apidone.controllers.delete = require('./lib/controllers/delete');

module.exports = apidone;