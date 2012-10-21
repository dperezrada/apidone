formatErrorHandler = (err, req, res, next) ->
  if err and err.type is "unexpected_token"
    res.send 400,
      error: "Bad request: Invalid JSON"

  else
    next err
express = require("express")
mongodb = require("mongodb")
async = require("async")
_ = require("underscore")
Server = mongodb.Server
Db = mongodb.Db
BSON = mongodb.BSONPure
MONGODB_HOST = process.env.MONGODB_HOST or "localhost"
MONGODB_PORT = parseInt process.env.MONGODB_PORT or 27017
MONGODB_DBNAME = process.env.MONGODB_DBNAME or "apidone_dev"
server = new Server(MONGODB_HOST, MONGODB_PORT,
  auto_reconnect: true
)
db = new Db(MONGODB_DBNAME, server, safe: true)
db.open (err, data) ->
  db_connected = false
  unless err
    if process.env.MONGODB_USER
      data.authenticate process.env.MONGODB_USER, process.env.MONGODB_PASSWORD, (err2, data2) ->
        unless err2
          db_connected = true
        else
          console.log "Error: Invalid database user or password"

    else
      db_connected = true
  if db_connected
    console.log "Connected to '" + MONGODB_DBNAME + "' database"
  else
    console.log "Error: Problem connecting to database"

configure_app = (app) ->
  app.configure ->
    app.use express.bodyParser()
    app.use app.router
    app.use formatErrorHandler

  app.configure "development", ->
    app.use express.errorHandler(
      dumpExceptions: true
      showStack: true
    )

  app.configure "production", ->
    app.use express.errorHandler()


clear_response = (response_el) ->
  response_el["id"] = "" + response_el["_id"]  unless response_el["id"]
  delete response_el["_id"]

  delete response_el["_internal_url"]

  delete response_el["_internal_parent_url"]

  delete response_el["_internal_parent_resource"]

get_prefix_interal_url = (prefix) ->
  prefix = prefix.substring(0, [prefix.length - 1])  if prefix and prefix[prefix.length - 1] is "/"
  prefix

create_internal_url = (prefix, id) ->
  get_prefix_interal_url(prefix) + "/" + id

app = module.exports = express()
configure_app app
Mongo =
  get_collection: (db, name, callback) ->
    db.collection name, callback

  insert: (collection, data, callback) ->
    collection.insert data,
      safe: true
    , callback

  update_internal_url: (final_url, _id, collection, callback) ->
    splited_url = final_url.split("/")
    resource_id = splited_url[splited_url.length - 1]
    resource = splited_url[splited_url.length - 2]
    parent_url = _.initial(splited_url).join("/")
    collection.update
      _id: _id
    ,
      $set:
        _internal_url: final_url
        _internal_parent_url: get_prefix_interal_url(parent_url)
        _internal_parent_resource: get_prefix_interal_url(resource)
        id: resource_id
    , (error, doc) ->
      callback error, final_url, resource_id


  update: (collection, selector, query, callback) ->
    collection.update selector, query, callback

  get_collections: (db, subdomain, callback) ->
    db.collectionNames (err, collections) ->
      collections_return = []
      db_name = process.env.MONGODB_DBNAME or "apidone_dev"
      collection = subdomain + "___"
      collection_start = db_name + "." + collection
      i = collections.length - 1

      while i >= 0
        collections_return.push name: collections[i]["name"].replace(collection_start, "")  if collections[i]["name"].indexOf(collection_start) is 0
        i--
      callback err, collections_return

