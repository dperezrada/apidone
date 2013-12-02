app.post "/*", (request, response) ->
  local_request = clone_request(request)
  async.waterfall [
    async.apply(Mongo.get_collection, db, local_request.collection)
    ,(collection, callback) ->
      Mongo.insert collection, local_request.body, (err, inserted_docs) ->
        _internal_url = _id = null
        unless err 
          id = _id = inserted_docs[0]["_id"]
          id = local_request.body.id  if local_request.body.id
          _internal_url = create_internal_url(local_request.route.params[0], id)
        callback err, _internal_url, _id, collection
    , Mongo.update_internal_url
  ], (err, final_url, id) ->
    if err
      console.error err
      response.statusCode = 503
      response.send "Internal Server Error"
    else
      response.status(201)
      response.header "Location", final_url
      response.send id: id