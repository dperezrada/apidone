module.exports = (request, response) ->
  db.collection request.collection, (err, collection) ->
    if request.query._remove is "all"
      query = $regex: "^" + request.route.params[0]
    else
      query = request.route.params[0]
    collection.remove
      _internal_url: query
    , {}, (error, result) ->
      if result
        response.statusCode = 204
        response.send()
      else
        response.statusCode = 404
        response.send()