var http = require('http');
var fs = require('fs');

//Ill evntually put these in a sperate file but for now just edit the actual server file for the configs.
//TODO: Set seprate file for Config.
//TODO: Set watcher on config file and reload on change.
//CONFIGS: 

var include_Module_Extentions = [ '.js' ];	 //Any files with this extention will be loaded as nodelets

var include_Module_Extentions_In_URL = true;   //If this is set to true then the url will care about the extention of the nodelet 
						//See readme for full explaination.

var nodelets_directory = './np';		//This is the path that the scanner will scan for all of the nodelets to include. 

var ignore_files = [ ];				//Ignore any files with any of these names.

var server_port = 9000; 			//The port we are running on.

var log_file_path = "nodePages.log";		//location of the logfile that node will log to

var log_to_stdin = true;			//True if you want the output to also be loged to STDIN (terminal)

var log_to_file = true;				//True if you want the output to also be loged to the log file.
						
var error_log_file_path = "nodeErrors.log";		//location of the error logfile that node will log to

var error_log_to_stdin = true;			//True if you want any errors to also be loged to STDIN (terminal)

var error_log_to_file = true;				//True if you want any errors to also be loged to the log file.

var ndir = nodelets_directory.replace(/(.[^\/]*\/)(?=\w)/,'');
console.log(ndir);
//Server
function connectionManager(req, res) {
        var data = {post: "", get:""};
        var url = req.url.replace(new RegExp('(.*\/)*\/'+ndir+'\/'), ""); //Grab the file from the url
	console.log(url);
        req.on('data', function(chunk) { //Get Post data
                chunk = unescape(chunk.toString()).replace(/\+/g, ' '); //Clear any encoding that we might have.
                data.post += chunk;
        });

	req.on('end', function(){ 
		if(req.url.indexOf("?") > -1){ // check for Get data
                        var d = req.url.slice(req.url.indexOf("?") + 1, req.url.length);
                        if(d != undefined){
                                data.get = decodeURI(d); //decode the url string.
                                url = url.substring(0, url.indexOf("?")); //removes get data from url because we use the url for routing.
                        }
                }
		LOGACCESS(url, JSON.stringify(data), req.headers["user-agent"], req.connection.remoteAddress); //log the server access
                if(router[url] != undefined){ //checks to see if the router has a given function. Then executes it.
                        try{
                                router[url].run(data, 
					function(resp, httpcode){ //When called it send resp back to the client.
						httpcode = httpcode == undefined ? 200: httpcode; //Default to 200
						res.writeHead(httpcode, { 
							'Content-Type': 'text/plain' //Set the content type.
						});
                                		res.end(resp); 
					});
                        }
                        catch(err){ //In the even that something goes haywire, this catch will cause the server to continue running.
				LOGERROR(err); //Never let an error bubble up to the event loop. Never.
                        }
                }
                else{
			res.writeHead(404, { 
				'Content-Type': 'text/plain' //Set the content type.
			});
			res.end("404 Error, The specified nodelet does not exist");//If the request doesnt exist.
                }
        });
}

//Error Logging:

//Sets up a clean exit no matter if we call LOGACCESS or LOGERROR or not.
process.on('SIGINT', function(){ 
	process.exit();
});

//Used to log when we hit the server with a request
var LOGACCESS = (function(){ 
	var stream = fs.createWriteStream(log_file_path, {flags:'a', encoding:'utf8'});
	stream.error = function(error){
		console.log("Error occured writing to log file" + JSON.stringify(error));
	};
	stream.drain = function(){
		writesafe = true;
	};
		
	process.on('exit', function(){
		console.log("Node Pages Server shutting down");
		stream.end();
	});
	return function(){
		var s = Array.prototype.slice.call(arguments).join('	');
		var s = '[' + new Date().toUTCString() + ']		' + s + "\n";
		if(log_to_stdin){
			console.log(s);
		}
		if(stream.writable && log_to_file){
			stream.write(s);
		}
	};
})();

//If we throw an error log it for later debuging.
var LOGERROR = (function(){
	var stream = fs.createWriteStream(error_log_file_path, {flags:'a', encoding:'utf8'});
	stream.error = function(error){
		console.log("Error occured writing to log file" + JSON.stringify(error));
	};
	stream.drain = function(){
		writesafe = true;
	};
	process.on('exit', function(){ 
		stream.end();
	});
		
	return function(err){
		var s = '[' + new Date().toUTCString() + ']		' + err + "\n" + err.stack + "\n";
		if(error_log_to_stdin){
			console.log(s);
		}
		if(stream.writable && error_log_to_file){
			stream.write(s);
		}
	};
})();

//Router
var router = {};

function walkDirTree(path){
	var walkStack = [path];
	var results = [];
	if(path[path.length-1] == "/"){ path.substring(0,path.length-2)}; //Get rid of any trailing '/'
	while(walkStack.length != 0){
		var dir = walkStack.pop();
		while(dir.indexOf("/.") != -1){
			dir = walkStack.pop();
		}
		var dirs = fs.readdirSync(dir);
		for(var file in dirs){
			file = dirs[file];
			if(!(file in ignore_files)){
				var filepath = dir +'/' + file
				var stat = fs.statSync(filepath);
				if(stat.isDirectory()){
					walkStack.push(filepath);
					fs.watch(filepath, watchFile(filepath));
				}
				else{
					for(var ext in include_Module_Extentions){
						ext = include_Module_Extentions[ext];
						if(file.indexOf(ext) == file.length - ext.length){
							if( include_Module_Extentions_In_URL){
								results.push(filepath);
							}
							else{
								results.push(filepath.slice(0,- ext.length));
							}
							fs.watch(filepath, watchFile(dir));
						}
					}
				}
			}
		}
	}
	return results;
};
var watchFile = function(path){
	var thispath = path;
 	return function (event, filename){
		console.log(event + " " + filename);
		var filepath = path + "/" + filename;
		try{
			if(filename[0] == '.' || filename in ignore_files){ return; }
			var stat = fs.statSync(filepath);
			if(stat.isDirectory()){
				fs.watch(filepath, watchFile(filepath));
				return;
			}
			for(var ext in include_Module_Extentions){
				ext = include_Module_Extentions[ext];
				if(filename.indexOf(ext) == filename.length - ext.length){
					if( !include_Module_Extentions_In_URL){
						filepath = filepath.slice(0,-ext.length);
					}
					console.log(event + " " + filepath);
					scanFile(filepath, path);
				}
			}
		}
		catch (err){
			LOGERROR(err); //If you delete a directory this will throw an error.
		}
	}
};

function scanFile(f, path){
	route = f.slice(path.length + 1);
	try{
		var name = require.resolve(f);
		delete require.cache[name];
		router[route] = require(f);
		console.log("	" + route + "	accessed at " + f);
	}
	catch(err){ 
		console.log("Could not include " + f)
		LOGERROR(err);
	 };
}

function createRouter(path){
	fs.watch(path, watchFile(path));	
	var files = walkDirTree(path);
	console.log("Loaded " + files.length + " Modules." );
	
	console.log("Routing with the following routes: ")
	for(var f in files){
		f = files[f];
		scanFile(f, path);
	}
	
};

createRouter(nodelets_directory);
http.createServer(connectionManager).listen(server_port);
console.log("Now listening at localhost:" + server_port);
