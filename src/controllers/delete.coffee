app.delete "/*", (request, response) ->
  local_request = clone_request(request)
  db.collection local_request.collection, (err, collection) ->
    query = local_request.route.params[0]
    if local_request.query._remove is "all"
      query = $regex: "^" + query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + "($|\/)"
    collection.remove
      _internal_url: query
    , {}, (error, result) ->
      if result
        response.statusCode = 204
        if local_request.query._remove is "all"
          collection.count({}, (error, items)->
            if items == 0
              collection.drop ()-> true
          )
      else
        response.statusCode = 404
      response.send()