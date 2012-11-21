cd /home/apidone/repos/apidone
source /home/apidone/configs/config_api
PROCESS_ID=`ps -ef | grep "node" | grep "apidone_api" | grep -v "grep" | awk '{print $2}'`;
if [[ $PROCESS_ID ]]; then
	echo "Stopping server, process_id: $PROCESS_ID"
	kill $PROCESS_ID;
	sleep 2;
fi
nohup node lib/main.js apidone_api >> /var/log/apidone/api/access.log 2>> /var/log/apidone/api/error.log < /dev/null&