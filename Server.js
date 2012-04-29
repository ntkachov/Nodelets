var http = require('http');
var fs = require('fs');

http.createServer(connectionManager).listen(9000);

//Server
function connectionManager(req, res) {
        var data = "";
        var url = req.url.replace(/(.*\/)*\/np\//, "");
        req.on('data', function(chunk) {
                chunk = unescape(chunk.toString());
                chunk = chunk.replace(/\+/g, ' ');
                data += chunk;
        });
        req.on('end', function(){
                if(data === "" && req.url.indexOf("?") > -1){
                        var d = req.url.slice(req.url.indexOf("?") + 1, req.url.length);
                        if(d != undefined){
                                data = decodeURI(d);
                                url = url.substring(0, url.indexOf("?"));
                        }
                }
		LOGACCESS(url, data);
                res.writeHead(200, {
                        'Content-Type': 'text/plain'
                });
                if(router[url] != undefined){ //checks to see if the router has a given function. Then executes it.
                        try{
                                router[url].run(data, function(resp){
                                res.end(resp);});
                        }
                        catch(err){
                                console.log(err);
                                console.trace();
                        }
                }
                else{
			res.end("404, The specified page does not exist");	
                }
        });
}

function LOGACCESS(){
	var s = Array.prototype.slice.call(arguments).join('	');
	console.log('[' + new Date().toUTCString() + ']		' + s);
}


//Router
var router = {};

function walkDirTree(path){
	var walkStack = [path];
	var results = [];
	if(path[path.length-1] == "/"){ path.substring(0,path.length-2)};
	while(walkStack.length != 0){
		var dir = walkStack.pop();
		if(dir.indexOf("/.") != -1){
			while(dir.indexOf("/.") != -1){
				dir = walkStack.pop();
				console.log("pop");
			}
		}
		console.log(dir);
		var dirs = fs.readdirSync(dir);
		//console.log(dirs);
		for(var file in dirs){
			file = dirs[file];
			var pathfile = dir +'/' + file
			var stat = fs.statSync(pathfile);
			if(stat.isDirectory()){
				walkStack.push(pathfile);
			}
			else{
				if(file.indexOf(".js") == file.length - 3){
					results.push(pathfile);
				}
			}
		}
	}
	return results;
}

function createRouter(path){
	if(path == undefined){ path = "np";};
	
	var files = walkDirTree(path);
	console.log();
	
	for(var f in files){
		f = files[f];
		route = f.slice(path.length + 1);
		router[route] = require("./" + f);
	}
}

createRouter();
