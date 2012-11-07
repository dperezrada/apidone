fs     = require 'fs'
{exec} = require 'child_process'
util   = require 'util'
# uglify = require 'uglify-js'

prodSrcCoffeeDir     = "src"
prodTargetJsDir      = 'lib'

prodCoffeeOpts = null
prodTargetFileName = null
prodTmpDirCoffee = null
prodTargetCoffeeFile = null
prodTargetJsFile = null
prodTargetJsMinFile = null

setup_global = (target) ->
    prodTargetFileName   = target
    prodTmpDirCoffee     = "#{prodSrcCoffeeDir}/tmp"
    prodTargetCoffeeFile = "#{prodTmpDirCoffee}/#{prodTargetFileName}.coffee"
    prodTargetJsFile     = "#{prodTargetJsDir}/#{prodTargetFileName}.js"
    prodTargetJsMinFile  = "#{prodTargetJsDir}/#{prodTargetFileName}.min.js"
    prodCoffeeOpts = "--bare --output #{prodTargetJsDir} --compile #{prodTmpDirCoffee}"
# testCoffeeOpts = "--output #{testTargetJsDir}"

prodCoffeeFiles = {
    'main': [
        'main/server'
        'main/libs/db'
        'main/libs/utils'
        'main/controllers/all'
        'main/controllers/get'
        'main/controllers/post'
        'main/controllers/put'
        'main/controllers/delete'
        'main/server_start'
    ],
    'admin': [
        'main/server'
        'main/libs/db'
        'admin/controllers/accounts'
        'main/server_start'
    ]
}

option '-a', '--application [NAME]', 'application name'
task 'build', 'Build a single JavaScript file from prod files', (options)->
    setup_global options.application
    fs.mkdir prodTmpDirCoffee, ->
        util.log "Building #{prodTargetJsFile}"
        appContents = new Array remaining = prodCoffeeFiles[prodTargetFileName].length
        util.log "Appending #{prodCoffeeFiles[prodTargetFileName].length} files to #{prodTmpDirCoffee}/#{prodTargetFileName}.js"
        
        for file, index in prodCoffeeFiles[prodTargetFileName] then do (file, index) ->
            fs.readFile "#{prodSrcCoffeeDir}/#{file}.coffee"
                      , 'utf8'
                      , (err, fileContents) ->
                handleError(err) if err
                
                appContents[index] = fileContents
                util.log "[#{index + 1}] #{file}.coffee"
                process() if --remaining is 0

        process = ->
            fs.writeFile prodTargetCoffeeFile
                       , appContents.join('\n\n')
                       , 'utf8'
                       , (err) ->
                handleError(err) if err
                
                exec "coffee #{prodCoffeeOpts}", (err, stdout, stderr) ->
                    handleError(err) if err
                    message = "Compiled #{prodTargetJsFile}"
                    util.log message
                    displayNotification message
                    fs.unlink prodTargetCoffeeFile, (err) -> handleError(err) if err
                    fs.rmdir prodTmpDirCoffee
                    # invoke 'uglify'

task 'uglify', 'Minify and obfuscate', ->
    jsp = uglify.parser
    pro = uglify.uglify

    fs.readFile prodTargetJsFile, 'utf8', (err, fileContents) ->
        ast = jsp.parse fileContents  # parse code and get the initial AST
        ast = pro.ast_mangle ast # get a new AST with mangled names
        ast = pro.ast_squeeze ast # get an AST with compression optimizations
        final_code = pro.gen_code ast # compressed code here
    
        fs.writeFile prodTargetJsMinFile, final_code
        fs.unlink prodTargetJsFile, (err) -> handleError(err) if err
        
        message = "Uglified #{prodTargetJsMinFile}"
        util.log message
        displayNotification message

handleError = (error) -> 
    util.log error
    displayNotification error

displayNotification = (message = '') -> 
    options = {
        title: 'CoffeeScript'
        image: 'lib/CoffeeScript.png'
    }
    try require('./node_modules/growl').notify message, options