fs     = require 'fs'
{exec} = require 'child_process'
util   = require 'util'

coffee_files = [
    'server'
    'libs/db'
    'libs/utils'
    'controllers/all'
    'controllers/get'
    'controllers/post'
    'controllers/put'
    'controllers/delete'
    'controllers/options'
    'controllers/patch'
    'server_start'
]

target_dir = './dist'
target = "#{target_dir}/apidone"
source_dir = './src'
coffee_options = "--bare --output #{target_dir} --compile #{target}.coffee"


task 'build', 'Build a single JavaScript file from prod files', (options)->
    fs.mkdir 'dist', ->
        util.log "Building"
        app_content = new Array
        remaining = coffee_files.length
        util.log "Appending #{remaining} files to #{target.coffee}"
        
        for file, index in coffee_files then do (file, index) ->
            fs.readFile "#{source_dir}/#{file}.coffee"
                      , 'utf8'
                      , (err, fileContents) ->
                handleError(err) if err
                
                app_content[index] = fileContents
                util.log "[#{index + 1}] #{file}.coffee"
                process() if --remaining is 0

        process = ->
            fs.writeFile "#{target}.coffee"
                       , app_content.join('\n\n')
                       , 'utf8'
                       , (err) ->
                handleError(err) if err
                
                exec "~/yes.we.code/apidone/node_modules/coffee-script/bin/coffee #{coffee_options}", (err, stdout, stderr) ->
                    handleError(err) if err
                    message = "Compiled #{target}.js"
                    util.log message
                    fs.unlink "#{target}.coffee", (err) -> handleError(err) if err

handleError = (error) -> 
    util.log error
