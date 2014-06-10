echo "Compiling Coffee"
./node_modules/coffee-script/bin/cake build;

echo "Starting the server"
node dist/apidone.js