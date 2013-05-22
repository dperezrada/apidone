// Generated by CoffeeScript 1.6.2
var BSON, Db, MONGODB_DBNAME, MONGODB_HOST, MONGODB_PORT, Mongo, PORT, Server, app, async, clear_response, configure_app, create_internal_url, db, express, formatErrorHandler, get_limit, get_offset, get_prefix_interal_url, get_sort, mongodb, prepare_db_filters, retrieve_collection, retrieve_subdomain, server, set_cors, _;

express = require("express");

async = require("async");

_ = require("underscore");

formatErrorHandler = function(err, req, res, next) {
  if (err && err.type === "unexpected_token") {
    return res.send(400, {
      error: "Bad request: Invalid JSON"
    });
  } else {
    return next(err);
  }
};

configure_app = function(app) {
  app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(app.router);
    return app.use(formatErrorHandler);
  });
  app.configure("development", function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  return app.configure("production", function() {
    return app.use(express.errorHandler());
  });
};

app = module.exports = express();

configure_app(app);

mongodb = require("mongodb");

Server = mongodb.Server;

Db = mongodb.Db;

BSON = mongodb.BSONPure;

MONGODB_HOST = process.env.MONGODB_HOST || "localhost";

MONGODB_PORT = parseInt(process.env.MONGODB_PORT || 27017);

MONGODB_DBNAME = process.env.MONGODB_DBNAME || "apidone_dev";

server = new Server(MONGODB_HOST, MONGODB_PORT, {
  auto_reconnect: true
});

db = new Db(MONGODB_DBNAME, server, {
  safe: true
});

db.open(function(err, data) {
  var db_connected;

  db_connected = false;
  if (!err) {
    if (process.env.MONGODB_USER) {
      data.authenticate(process.env.MONGODB_USER, process.env.MONGODB_PASSWORD, function(err2, data2) {
        if (!err2) {
          return db_connected = true;
        } else {
          return console.error("Error: Invalid database user or password");
        }
      });
    } else {
      db_connected = true;
    }
  }
  if (db_connected) {
    return console.log("Connected to '" + MONGODB_DBNAME + "' database");
  } else {
    return console.error("Error: Problem connecting to database");
  }
});

Mongo = {
  get_collection: function(db, name, callback) {
    return db.collection(name, callback);
  },
  insert: function(collection, data, callback) {
    return collection.insert(data, {
      safe: true
    }, callback);
  },
  update_internal_url: function(final_url, _id, collection, callback) {
    var parent_url, resource, resource_id, splited_url;

    splited_url = final_url.split("/");
    resource_id = splited_url[splited_url.length - 1];
    resource = splited_url[splited_url.length - 2];
    parent_url = _.initial(splited_url).join("/");
    return collection.update({
      _id: _id
    }, {
      $set: {
        _internal_url: final_url,
        _internal_parent_url: get_prefix_interal_url(parent_url),
        _internal_parent_resource: get_prefix_interal_url(resource),
        id: resource_id
      }
    }, function(error, doc) {
      return callback(error, final_url, resource_id);
    });
  },
  update: function(collection, selector, query, callback) {
    return collection.update(selector, query, callback);
  },
  get_collections: function(db, subdomain, callback) {
    return db.collectionNames(function(err, collections) {
      var collection, collection_start, collections_return, db_name, i;

      collections_return = [];
      db_name = process.env.MONGODB_DBNAME || "apidone_dev";
      collection = subdomain + "___";
      collection_start = db_name + "." + collection;
      i = collections.length - 1;
      while (i >= 0) {
        if (collections[i]["name"].indexOf(collection_start) === 0) {
          collections_return.push({
            name: collections[i]["name"].replace(collection_start, "")
          });
        }
        i--;
      }
      return callback(err, collections_return);
    });
  }
};

clear_response = function(response_el) {
  if (!response_el["id"]) {
    response_el["id"] = "" + response_el["_id"];
  }
  delete response_el["_id"];
  delete response_el["_internal_url"];
  delete response_el["_internal_parent_url"];
  return delete response_el["_internal_parent_resource"];
};

get_prefix_interal_url = function(prefix) {
  if (prefix && prefix[prefix.length - 1] === "/") {
    prefix = prefix.substring(0, [prefix.length - 1]);
  }
  return prefix;
};

create_internal_url = function(prefix, id) {
  return get_prefix_interal_url(prefix) + "/" + id;
};

retrieve_subdomain = function(request) {
  var server_host, subdomain;

  server_host = process.env.APIDONE_HOST || "apidone.com";
  subdomain = process.env.APIDONE_DEFAULT_SUBDOMAIN || request.headers.host.split("." + server_host)[0];
  return subdomain.replace(".", "_");
};

retrieve_collection = function(request) {
  var base_resource, subdomain;

  subdomain = retrieve_subdomain(request);
  base_resource = request.route.params[0].split("/")[0];
  if (base_resource === "__resources") {
    base_resource = "";
  }
  return subdomain + "___" + base_resource;
};

set_cors = function(response) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
  return response.header("Access-Control-Allow-Methods", "OPTIONS,GET,HEAD,POST,PUT,DELETE");
};

app.all("/*", function(request, response, next) {
  request.collection = retrieve_collection(request);
  set_cors(response);
  return next();
});

app.get("/amazon_lb", function(request, response) {
  response.statusCode = 200;
  return response.send({
    "status": "OK"
  });
});

prepare_db_filters = function(query_string) {
  var error, filters, key;

  filters = _.clone(query_string);
  if (filters.id) {
    try {
      filters["_id"] = new mongodb.BSONPure.ObjectID(filters.id);
      delete filters["id"];
    } catch (_error) {
      error = _error;
      console.log("cannot convert to mongodb id: " + filters.id);
    }
  }
  for (key in filters) {
    if (!isNaN(parseInt(filters[key], 10))) {
      filters[key] = {
        $in: [filters[key], parseInt(filters[key], 10)]
      };
    }
  }
  return filters;
};

get_sort = function(query, filters) {
  var _sort_by, _sort_type;

  _sort_by = "_id";
  _sort_type = "desc";
  if (query._sort_by) {
    _sort_by = query._sort_by;
    delete filters["_sort_by"];
  }
  if (query._sort_type) {
    _sort_type = query._sort_type;
    delete filters["_sort_type"];
  }
  return [_sort_by, _sort_type];
};

get_limit = function(query, filters) {
  var limit_int;

  if (query._limit) {
    limit_int = parseInt(query._limit, 10);
    if (!isNaN(limit_int)) {
      delete filters["_limit"];
      return limit_int;
    }
  }
  return 0;
};

get_offset = function(query, filters) {
  var offset_int;

  if (query._offset) {
    offset_int = parseInt(query._offset, 10);
    if (!isNaN(offset_int)) {
      delete filters["_offset"];
      return offset_int;
    }
  }
  return 0;
};

app.get("/*", function(request, response) {
  if (request.route.params[0] === "__resources") {
    return Mongo.get_collections(db, retrieve_subdomain(request), function(err, collections) {
      return response.send(collections);
    });
  } else {
    return db.collection(request.collection, function(err, collection) {
      var internal_parent_url;

      if (request.route.params[0].indexOf("__resources") > 0) {
        internal_parent_url = request.route.params[0].replace("/__resources", "");
        return collection.distinct("_internal_parent_resource", {
          _internal_parent_url: {
            $regex: "^" + internal_parent_url + "/[^/]+$"
          }
        }, function(error, resources) {
          return response.send(_.map(resources, function(resource) {
            return {
              name: resource
            };
          }));
        });
      } else {
        return collection.findOne({
          _internal_url: request.route.params[0]
        }, {}, function(error, result) {
          var filters, limit, offset, _ref, _sort_by, _sort_type;

          if (result) {
            clear_response(result);
            return response.send(result);
          } else {
            filters = prepare_db_filters(request.query);
            _ref = get_sort(request.query, filters), _sort_by = _ref[0], _sort_type = _ref[1];
            limit = get_limit(request.query, filters);
            offset = get_offset(request.query, filters);
            filters["_internal_parent_url"] = get_prefix_interal_url(request.route.params[0]);
            if (request.query._select_distinct) {
              delete filters["_select_distinct"];
              return collection.distinct(request.query._select_distinct, filters, function(error, items) {
                return response.send(_.map(items, function(item) {
                  var response_item;

                  response_item = {};
                  response_item[request.query._select_distinct] = item;
                  return response_item;
                }));
              });
            } else {
              return collection.find(filters, {}, function(error, cursor) {
                return cursor.sort([[_sort_by, _sort_type]]).limit(limit).skip(offset).toArray(function(err, items) {
                  var i, to_return;

                  to_return = [];
                  if (items === null || items.length === 0) {
                    if (request.query._default) {
                      to_return = request.query._default;
                    }
                    return response.send(to_return);
                  } else {
                    for (i in items) {
                      clear_response(items[i]);
                      to_return.push(items[i]);
                    }
                    return response.send(to_return);
                  }
                });
              });
            }
          }
        });
      }
    });
  }
});

app.post("/*", function(request, response) {
  return async.waterfall([
    async.apply(Mongo.get_collection, db, request.collection), function(collection, callback) {
      return Mongo.insert(collection, request.body, function(err, inserted_docs) {
        var id, _id, _internal_url;

        _internal_url = _id = null;
        if (!err) {
          id = _id = inserted_docs[0]["_id"];
          if (request.body.id) {
            id = request.body.id;
          }
          _internal_url = create_internal_url(request.route.params[0], id);
        }
        return callback(err, _internal_url, _id, collection);
      });
    }, Mongo.update_internal_url
  ], function(err, final_url, id) {
    if (err) {
      console.error(err);
      response.statusCode = 503;
      return response.send("Internal Server Error");
    } else {
      response.status(201);
      response.header("Location", final_url);
      return response.send({
        id: id
      });
    }
  });
});

app.put("/*", function(request, response) {
  var found_resource, resource_id, splited_url;

  found_resource = false;
  splited_url = request.route.params[0].split("/");
  resource_id = splited_url[splited_url.length - 1];
  if (request.body["id"]) {
    delete request.body["id"];
  }
  return async.waterfall([
    async.apply(Mongo.get_collection, db, request.collection), function(collection, callback) {
      return collection.findOne({
        _internal_url: request.route.params[0]
      }, {}, function(error, resource) {
        if (resource) {
          found_resource = true;
          request.body["_id"] = resource["_id"];
          return collection.update({
            _internal_url: request.route.params[0]
          }, request.body, function(error, result) {
            return callback(error, resource["_internal_url"], resource["_id"], collection);
          });
        } else {
          return Mongo.insert(collection, request.body, function(err, inserted_docs) {
            return callback(error, request.route.params[0], inserted_docs[0]["_id"], collection);
          });
        }
      });
    }, Mongo.update_internal_url
  ], function(err, final_url, id) {
    if (err) {
      console.error(err);
      response.statusCode = 503;
      return response.send("Internal Server Error");
    } else if (found_resource) {
      response.statusCode = 204;
      return response.send();
    } else {
      response.statusCode = 201;
      response.header("Location", final_url);
      return response.send({
        id: id
      });
    }
  });
});

app["delete"]("/*", function(request, response) {
  return db.collection(request.collection, function(err, collection) {
    var query;

    query = request.route.params[0];
    if (request.query._remove === "all") {
      query = {
        $regex: "^" + query
      };
    }
    return collection.remove({
      _internal_url: query
    }, {}, function(error, result) {
      if (result) {
        response.statusCode = 204;
      } else {
        response.statusCode = 404;
      }
      return response.send();
    });
  });
});

app.options("/*", function(request, response) {
  response.status(200);
  response.header("Allow", 'OPTIONS,GET,POST,PUT,DELETE');
  return response.send("");
});

if (!module.parent) {
  PORT = process.env.APIDONE_PORT || process.env.PORT || 3000;
  app.listen(PORT);
  console.log("Express server listening on port %d in %s mode", PORT, app.settings.env);
}
