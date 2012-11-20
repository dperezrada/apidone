crypto = require('crypto')
SALT = 'Esto es lo mejor que se me ocurrio como salt'

set_cors = (response) ->
	response.header "Access-Control-Allow-Origin", "*"
	response.header "Access-Control-Allow-Headers", "X-Requested-With,Content-Type"
	response.header "Access-Control-Allow-Methods", "OPTIONS,GET,HEAD,POST,PUT,DELETE"

app.all "/*", (request, response, next) ->
	as_cookie = request.cookies.as
	request.account = null
	if as_cookie
		Mongo.get_collection db, 'accounts', (err, collection) ->
			collection.findOne {sessions: as_cookie}, (err, account_exists) ->
				request.account = account_exists
				next()
	else
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

encrypt_pass = (pass) ->
	shasum = crypto.createHash('sha1');
	shasum.update(SALT + pass);
	return shasum.digest('hex');

app.get "/subdomains", (request, response) ->
	if request.account
		response.send request.account.subdomains
	else
		response.statusCode = 401
		response.send {'code': 401, 'err': 'Unauthorized.'}


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
								request.body.pass = encrypt_pass(request.body.pass);
								request.body['subdomains'] = [request.body.subdomain]
								request.body['sessions'] = []
								delete request.body['subdomain']
								Mongo.insert collection, request.body, (err, inserted_account) ->
									callback err, request.body['subdomains'][0]
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

app.post "/login", (request, response) ->
	async.waterfall [
		async.apply(Mongo.get_collection, db, 'accounts')
		,(collection, callback) ->
			if request.body.email and request.body.pass
				collection.findOne {
					email: request.body.email,
					pass: encrypt_pass(request.body.pass);
				}, (err, account_exists) ->
					if err
						callback {'code': 500, 'err': 'Ups. something unespected happend.'}, null
					else
						if account_exists
							crypto.randomBytes 48, (ex, buf) ->
								session = buf.toString('hex')
								account_exists.sessions.push(session)
								collection.save account_exists, (err, update_response) ->
									callback null, session
						else
							callback {'code': 401, 'err': 'Unauthorized.'}, null
			else
				callback {'code': 400, 'err': 'To login you have to send the email and password.'}, null
	], (err, session) ->
		if err
			if err.code
				response.statusCode = err.code
				response.send err
			else
				response.statusCode = 503
				response.send "Internal Server Error"
		else
			response.statusCode = 201
			response.cookie('as', session, { path: '/', expires: new Date(Date.now() + 60*60*24*31*1000) });
			response.send {"status": "OK"}