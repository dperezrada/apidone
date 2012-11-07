prepare_db_filters = (query_string) ->
  filters = _.clone(query_string)
  if filters.id
    filters["_id"] = new mongodb.BSONPure.ObjectID(query_params.id)
    delete filters["id"]
  
  # Search for numbers as string and integer
  for key of filters
    filters[key] = $in: [filters[key], parseInt(filters[key], 10)]  unless isNaN(parseInt(filters[key], 10))
  filters

app.get "/*", (request, response) ->
  if request.route.params[0] is "__resources"
    Mongo.get_collections db, retrieve_subdomain(request), (err, collections) ->
      response.send collections
  else
    db.collection request.collection, (err, collection) ->
      if request.route.params[0].indexOf("__resources") > 0
        internal_parent_url = request.route.params[0].replace("/__resources", "")
        collection.distinct "_internal_parent_resource",
          _internal_parent_url:
            $regex: "^" + internal_parent_url + "/[^/]+$"
        , (error, resources) ->
          response.send _.map(resources, (resource) ->
            name: resource
          )

      else
        collection.findOne
          _internal_url: request.route.params[0]
        , {}, (error, result) ->
          if result
            clear_response result
            response.send result
          else
            filters = prepare_db_filters(request.query)
            filters["_internal_parent_url"] = get_prefix_interal_url(request.route.params[0])
            _sort_by = "_id"
            _sort_type = "desc"
            if request.query._sort_by
              _sort_by = request.query._sort_by
              delete filters["_sort_by"]
            if request.query._sort_type
              _sort_type = request.query._sort_type
              delete filters["_sort_type"]
            if request.query._select_distinct
              delete filters["_select_distinct"]

              collection.distinct request.query._select_distinct, filters, (error, items) ->
                response.send _.map(items, (item) ->
                  response_item = {}
                  response_item[request.query._select_distinct] = item
                  response_item
                )

            else
              collection.find filters, {}, (error, cursor) ->
                cursor.sort([[_sort_by, _sort_type]]).toArray (err, items) ->
                  to_return = []
                  if items is null or items.length is 0
                    to_return = request.query._default  if request.query._default
                    response.send to_return
                  else
                    for i of items
                      clear_response items[i]
                      to_return.push items[i]
                    response.send to_return