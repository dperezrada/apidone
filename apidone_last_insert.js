collections = db.getCollectionNames();
ObjectId.prototype.getTimestamp = function() {
    return new Date(parseInt(this.toString().slice(0,8), 16)*1000);
}

data = []
for (var i = collections.length - 1; i >= 0; i--) {
	var collection = collections[i];
	if(collection.indexOf("_")>=0){
		resources = db[collection].find().sort({'_id': -1}).limit(10);
		while(resources.hasNext()){
			var resource = resources.next();
			if(resource._id){
				data.push([collection, resource._id.getTimestamp()]);
			}
		}
	}
}

function sortfunction(a, b){
	return b[1] - a[1];
}
data.sort(sortfunction);

for (var i = data.length - 1; i >= 0; i--) {
	print(data[i][0]+ "\t\t\t"+ data[i][1]);
};