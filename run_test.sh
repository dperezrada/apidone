DIR=`dirname $0`
cd $DIR

# Saving previously setted variables
PRE_MONGODB_DBNAME=$MONGODB_DBNAME
PRE_MONGODB_HOST=$MONGODB_HOST
PRE_MONGODB_PORT=$MONGODB_PORT
PRE_APIDONE_HOST=$APIDONE_HOST
PRE_APIDONE_PORT=$APIDONE_PORT
PRE_APIDONE_DEFAULT_SUBDOMAIN=$APIDONE_DEFAULT_SUBDOMAIN

# Setting new variables
export MONGODB_DBNAME=test_apidone
export MONGODB_HOST=localhost
export MONGODB_PORT=27017
export APIDONE_HOST=localhost
export APIDONE_PORT=3001
export APIDONE_DEFAULT_SUBDOMAIN=test

echo "Generating admin files"
cake -a "admin" build; cake -a "main" build;

echo "Compiling tests"
coffee --output test/main --compile test/main/*.coffee

mkdir -p logs
echo "Starting the server"
nohup node lib/main.js test_apidone > logs/server.log &
export APIDONE_PORT_ADMIN=3002
export APIDONE_PORT=3002
nohup node lib/admin.js test_apidone_admin > logs/admin_server.log &
export APIDONE_PORT=3001
sleep 2;

echo "Running tests"
./node_modules/.bin/mocha -b test/admin test/main;

PROCESS_ID=`ps -ef | grep "node" | grep "test_apidone_admin" | grep -v "grep" | awk '{print $2}'`;
echo "Stopping admin server, process_id: $PROCESS_ID"
kill $PROCESS_ID;

PROCESS_ID=`ps -ef | grep "node" | grep "test_apidone" | grep -v "grep" | awk '{print $2}'`;
echo "Stopping server, process_id: $PROCESS_ID"
kill $PROCESS_ID;

# Setting variables to their original value
export MONGODB_DBNAME=$PRE_MONGODB_DBNAME
export MONGODB_HOST=$PRE_MONGODB_HOST
export MONGODB_PORT=$PRE_MONGODB_PORT
export APIDONE_HOST=$PRE_APIDONE_HOST
export APIDONE_PORT=$PRE_APIDONE_PORT
export APIDONE_DEFAULT_SUBDOMAIN=$PRE_APIDONE_DEFAULT_SUBDOMAIN
