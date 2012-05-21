exports.absolute_url = function(resource_url){
	return 'http://'+process.env.APIDONE_HOST+':'+process.env.APIDONE_PORT+resource_url;	
}