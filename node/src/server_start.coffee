unless module.parent
  PORT = process.env.APIDONE_PORT or process.env.PORT or 3000
  app.listen PORT
  console.log "Express server listening on port %d in %s mode", PORT, app.settings.env
