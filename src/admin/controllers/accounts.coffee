crypto = require('crypto')
SALT = 'Esto es lo mejor que se me ocurrio como salt'

set_cors = (response) ->
  response.header "Access-Control-Allow-Origin", "*"
  response.header "Access-Control-Allow-Headers", "X-Requested-With,Content-Type"
  response.header "Access-Control-Allow-Methods", "OPTIONS,GET,HEAD,POST,PUT,DELETE"

app.all "/*", (request, response, next) ->
  set_cors response
  next()

app.options "/*", (request, response) ->
	response.send("")

check_subdomain = (collection, subdomain, callback) ->
	collection.findOne 'subdomains': subdomain, (err, account) ->
		if err
			callback err, null
		else if account and account.subdomain
			callback null, 'Not Available'
		else
			callback null, 'Available'

app.post "/subdomains", (request, response) ->
	if not request.body.subdomain
		response.statusCode = 400
		response.send {'err': 'Bad Request'}
	else
		Mongo.get_collection db, 'accounts', (err, collection) ->
			check_subdomain collection, request.body.subdomain, (err, status) ->
				if err
					response.statusCode = 400
					response.send {'err': 'Bad Request'}
				else
					response.statusCode = 200
					response.send {'status': status}

app.post "/accounts", (request, response) ->
	async.waterfall [
		async.apply(Mongo.get_collection, db, 'accounts')
		,(collection, callback) ->
			if request.body.email and request.body.pass and request.body.subdomain
				collection.findOne {email: request.body.email}, (err, account_exists) ->
					if err
						callback {'code': 500, 'err': 'Ups. something unespected happend.'}, null
					else if account_exists
						callback {'code': 409, 'err': 'User already has an account.'}, null
					else
						check_subdomain collection, request.body.subdomain, (err, status) ->
							if err
								callback {'code': 500, 'err': 'Ups. something unespected happend.'}, null
							else if status == 'Available'
								shasum = crypto.createHash('sha1');
								shasum.update(SALT + request.body.pass);
								request.body.pass = shasum.digest('hex');
								request.body['subdomains'] = [request.body.subdomain]
								delete request.body['subdomain']
								Mongo.insert collection, request.body, (err, inserted_account) ->
									callback err, request.body.subdomain
							else
								callback {'code': 409, 'err': 'You have to choose another subdomain.'}, null
			else
				callback {'code': 400, 'err': 'You have to fill all the fields.'}, null
	], (err, subdomain) ->
		if err
			if err.code
				response.statusCode = err.code
				response.send err
			else
				response.statusCode = 503
				response.send "Internal Server Error"
		else
			response.statusCode = 201
			response.send id: subdomain