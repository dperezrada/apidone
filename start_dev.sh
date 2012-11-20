DIR=`dirname $0`
cd $DIR

# Setting new variables
export MONGODB_DBNAME=dev_apidone
export MONGODB_HOST=localhost
export MONGODB_PORT=27017
export APIDONE_HOST=localhost
export APIDONE_PORT=3001
export APIDONE_DEFAULT_SUBDOMAIN=dev

mkdir -p logs
echo "Starting the server"
#nohup node lib/main.js dev_apidone > logs/dev_server.log &
export APIDONE_PORT_ADMIN=3002
export APIDONE_PORT=3002
node lib/admin.js dev_apidone_admin
#> logs/dev_admin_server.log &

