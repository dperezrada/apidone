app.put "/*",  (request, response) ->
  found_resource = false
  splited_url = request.route.params[0].split("/")
  resource_id = splited_url[splited_url.length - 1]
  delete request.body["id"]  if request.body["id"]

  local_request = clone_request(request)

  async.waterfall [
    async.apply(Mongo.get_collection, db, local_request.collection),
    (collection, callback) ->
      collection.findOne _internal_url: local_request.route.params[0], {}, (error, resource) ->
        if resource
          found_resource = true
          local_request.body["_id"] = resource["_id"]
          collection.update
            _internal_url: local_request.route.params[0]
          , local_request.body, (error, result) ->
            callback error, resource["_internal_url"], resource["_id"], collection
        else
          Mongo.insert collection, local_request.body, (err, inserted_docs) ->
            callback error, local_request.route.params[0], inserted_docs[0]["_id"], collection
    , Mongo.update_internal_url
  ], (err, final_url, id) ->
    if err
      console.error err
      response.statusCode = 500
      response.send "Internal Server Error"
    else if found_resource
      response.statusCode = 204
      response.send()
    else
      response.statusCode = 201
      response.header "Location", final_url
      response.send id: id


