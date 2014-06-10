app.options "/*", (request, response) ->
  response.status(200)
  response.header "Allow", 'OPTIONS,GET,POST,PUT,DELETE,PATCH'
  response.send ""