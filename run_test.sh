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

echo "Compiling Coffee"
./node_modules/coffee-script/bin/cake build;

mkdir -p logs
echo "Starting the server"
node dist/apidone.js test_apidone > logs/server.log 2> logs/server.err &
sleep 2;

echo "Running tests"
./node_modules/.bin/mocha -b test;

PROCESS_ID=`ps aux | grep "node" | grep "test_apidone" | grep -v "grep" | awk '{print $2}'`;
echo "Stopping server, process_id: $PROCESS_ID"
kill $PROCESS_ID;

# Setting variables to their original value
export MONGODB_DBNAME=$PRE_MONGODB_DBNAME
export MONGODB_HOST=$PRE_MONGODB_HOST
export MONGODB_PORT=$PRE_MONGODB_PORT
export APIDONE_HOST=$PRE_APIDONE_HOST
export APIDONE_PORT=$PRE_APIDONE_PORT
export APIDONE_DEFAULT_SUBDOMAIN=$PRE_APIDONE_DEFAULT_SUBDOMAIN
