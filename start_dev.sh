DIR=`dirname $0`
cd $DIR
DIR=`pwd`

get_process()
{
	echo `ps -ef | grep "$1" | grep -v "grep" | awk '{print $2}'`;
}

kill_process()
{
	PROCESS_ID=$(get_process "$1");
	if [[ $PROCESS_ID ]]; then
		echo "Stopping server, process_id: $PROCESS_ID"
		kill $PROCESS_ID;
	fi
}

# Setting new variables
export MONGODB_DBNAME=dev_apidone
export MONGODB_HOST=localhost
export MONGODB_PORT=27017
export APIDONE_HOST=localhost
export APIDONE_PORT=3001
export APIDONE_DEFAULT_SUBDOMAIN=dev
export APIDONE_DEFAULT_SUBDOMAIN=dev


mkdir -p logs

echo "Compiling service"
cake -a "admin" build;
cake -a "main" build;

echo "Starting the server"
nohup node lib/main.js dev_apidone > $DIR/logs/dev_server.log &
echo "apidone_api is up: $(get_process 'dev_apidone');"

export APIDONE_PORT_ADMIN=3002
export APIDONE_PORT=3002
nohup node lib/admin.js dev_apidone_admin > $DIR/logs/dev_admin_server.log & 
echo "apidone_admin is up: $(get_process 'dev_apidone_admin');"

echo "Generating pages"
nohup jade -w $DIR/pages/src/pages/*.jade --out $DIR/pages/public/ > logs/jade.log&
lessc  $DIR/pages/src/css/main.less > $DIR/pages/public/assets/css/main.css &
cd $DIR/pages/public
nohup python -m SimpleHTTPServer 8000 dev_apidone_public > $DIR/logs/dev_public.log &
echo "Webpages running in localhost:8000"
cd $DIR

control_c()
# run if user hits control-c
{
	kill_process "dev_apidone_admin";
	kill_process "dev_apidone_public";
	kill_process "jade -w";
	kill_process "dev_apidone";
  	echo -en "\n*** Finishing Apidone dev! Exiting ***\n"
  	exit $?
}

trap control_c SIGINT

# main() loop
while true; do read x; done
