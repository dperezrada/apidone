express = require("express")
async = require("async")
_ = require("underscore")

formatErrorHandler = (err, req, res, next) ->
  if err and err.type is "unexpected_token"
    res.send 400,
      error: "Bad request: Invalid JSON"
  else
    next err

configure_app = (app) ->
  app.configure ->
    app.use express.bodyParser()
    app.use express.cookieParser()
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