express = require("express")
async = require("async")
_ = require("underscore")
clone = require('clone')

formatErrorHandler = (err, req, res, next) ->
  if err and err.type is "unexpected_token"
    res.send 400,
      error: "Bad request: Invalid JSON"
  else
    next err

# get_extension = (req, res, next) ->
#   req.extension = req.originalUrl.match(/.*\.([^\.]*)$/)
#   next()

configure_app = (app) ->
  app.configure ->
    app.use express.bodyParser()
    app.use express.cookieParser()
    # app.use get_format
    app.use app.router
    app.use formatErrorHandler

  app.configure "development", ->
    app.use express.errorHandler(
      dumpExceptions: true
      showStack: true
    )

  app.configure "production", ->
    app.use express.errorHandler()

app = module.exports = express()
configure_app app