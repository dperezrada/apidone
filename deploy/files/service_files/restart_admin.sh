cd /home/apidone/repos/apidone
source /home/apidone/configs/config_admin
PROCESS_ID=`ps -ef | grep "node" | grep "apidone_admin" | grep -v "grep" | awk '{print $2}'`;
if [[ $PROCESS_ID ]]; then
	echo "Stopping server, process_id: $PROCESS_ID"
	kill $PROCESS_ID;
	sleep 2;
fi
nohup node lib/admin.js apidone_admin >> /var/log/apidone/admin/access.log 2>> /var/log/apidone/admin/error.log < /dev/null&