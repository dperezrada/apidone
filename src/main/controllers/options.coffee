app.options "/*", (request, response) ->
	response.status(200)
	response.header "Allow", 'OPTIONS,GET,HEAD,POST,PUT,DELETE'
	response.send ""