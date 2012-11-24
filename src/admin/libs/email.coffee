aws = require 'aws-lib'
fs = require 'fs'
path = require 'path'

send_email = (recipient_email, apidone_url, template, callback) ->
	console.log "sending email to #{recipient_email}"
	if process.env.AWS_SES_ACCESS
		console.log "access"
		ses = aws.createSESClient(process.env.AWS_SES_ACCESS, process.env.AWS_SES_SECRET);
		fs.readFile path.resolve(__dirname, "../templates/email/#{template}/html.html")
			,'UTF-8'
			,(err,html) ->
				html = html.replace("___apidone_url___", apidone_url)
				send_args =
					'Destination.ToAddresses.member.1': recipient_email
					'Message.Body.Html.Charset': 'UTF-8'
					'Message.Body.Html.Data': html
					'Message.Subject.Charset': 'UTF-8'
					'Message.Subject.Data': 'Welcome to APIdone.com'
					'Source': 'info@apidone.com'
				try
					ses.call 'SendEmail', send_args, callback
				catch e
					console.err "ERROR sending email to #{recipient_email}"
					console.err e
					callback e, null
	else
		console.log "Omitting email for #{recipient_email}"
		callback null, null