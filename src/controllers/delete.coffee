app.delete "/*", (request, response) ->
  db.collection request.collection, (err, collection) ->
    query = request.route.params[0]
    if request.query._remove is "all"
      query = $regex: "^" + query
    collection.remove
      _internal_url: query
    , {}, (error, result) ->
      if result
        response.statusCode = 204
      else
        response.statusCode = 404
      response.send()