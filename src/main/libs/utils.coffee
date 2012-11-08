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