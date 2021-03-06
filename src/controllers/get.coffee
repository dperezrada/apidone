prepare_db_filters = (query_string) ->
  filters = _.clone(query_string)
  if filters.id
    try
      filters["_id"] = new mongodb.BSONPure.ObjectID(filters.id)
      delete filters["id"]
    catch error
      console.log("cannot convert to mongodb id: "+filters.id)
  
  # Search for numbers as string and integer
  for key of filters
    filters[key] = $in: [filters[key], parseInt(filters[key], 10)]  unless isNaN(parseInt(filters[key], 10))
  filters

get_sort = (query, filters) ->
  _sort_by = "_id"
  _sort_type = "desc"
  if query._sort_by
    _sort_by = query._sort_by
    delete filters["_sort_by"]
  if query._sort_type
    _sort_type = query._sort_type
    delete filters["_sort_type"]
  return [_sort_by, _sort_type]

get_limit = (query, filters) ->
  if query._limit
    limit_int = parseInt(query._limit, 10)
    unless isNaN(limit_int)
      delete filters["_limit"]
      return limit_int
  return 0

get_offset = (query, filters) ->
  if query._offset
    offset_int = parseInt(query._offset, 10)
    unless isNaN(offset_int)
      delete filters["_offset"]
      return offset_int
  return 0

app.get "/*", (request, response) ->
  local_request = clone_request(request)
  if local_request.route.params[0] is "__resources"
    Mongo.get_collections db, retrieve_subdomain(local_request), (err, collections) ->
      response.send collections
  else
    db.collection local_request.collection, (err, collection) ->
      if local_request.route.params[0].indexOf("__resources") > 0
        internal_parent_url = local_request.route.params[0].replace("/__resources", "")
        collection.distinct "_internal_parent_resource",
          _internal_parent_url:
            $regex: "^" + internal_parent_url + "/[^/]+$"
        , (error, resources) ->
          response.send _.map(resources, (resource) ->
            name: resource
          )

      else
        collection.findOne
          _internal_url: local_request.route.params[0]
        , {}, (error, result) ->
          if result
            clear_response result
            response.send result
          else
            filters = prepare_db_filters(local_request.query)
            [_sort_by, _sort_type] = get_sort(local_request.query, filters)
            limit = get_limit(local_request.query, filters)
            offset = get_offset(local_request.query, filters)
            filters["_internal_parent_url"] = get_prefix_interal_url(local_request.route.params[0])

            if local_request.query._select_distinct
              delete filters["_select_distinct"]
              collection.distinct local_request.query._select_distinct, filters, (error, items) ->
                response.send _.map(items, (item) ->
                  response_item = {}
                  response_item[local_request.query._select_distinct] = item
                  response_item
                )

            else
              collection.find filters, {}, (error, cursor) ->
                cursor.sort([[_sort_by, _sort_type]]).limit(limit).skip(offset).toArray (err, items) ->
                  to_return = []
                  if items is null or items.length is 0
                    to_return = local_request.query._default  if local_request.query._default
                    response.send to_return
                  else
                    for i of items
                      clear_response items[i]
                      to_return.push items[i]
                    response.send to_return