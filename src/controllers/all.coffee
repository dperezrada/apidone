retrieve_subdomain = (request) ->
  server_host = process.env.APIDONE_HOST or "apidone.com"
  subdomain = process.env.APIDONE_DEFAULT_SUBDOMAIN or request.headers.host.split("." + server_host)[0]
  subdomain.replace ".", "_"

retrieve_collection = (request) ->
  subdomain = retrieve_subdomain(request)
  base_resource = request.route.params[0].split("/")[0]
  base_resource = ""  if base_resource is "__resources"
  subdomain + "___" + base_resource

set_cors = (response) ->
  response.header "Access-Control-Allow-Origin", "*"
  response.header "Access-Control-Allow-Headers", "X-Requested-With,Content-Type"
  response.header "Access-Control-Allow-Methods", "OPTIONS,GET,HEAD,POST,PUT,DELETE"

app.all "/*", (request, response, next) ->
  request.collection = retrieve_collection(request)
  set_cors response
  next()

app.get "/amazon_lb", (request, response) ->
  response.statusCode = 200
  response.send {"status": "OK"}