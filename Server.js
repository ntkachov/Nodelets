var http = require('http');
var fs = require('fs');

//Ill evntually put these in a sperate file but for now just edit the actual server page for the configs.
//CONFIGS: 

var included_Module_Extentions = [ '.js' ]; //Any files with this extention will be loaded as paged

var include_Module_Extentions_In_URL = false;   //If this is set to true then the url will care about the extention of the module. 
						//if true: www.example.com/np/mypage.js != www.example.com/np/mypage
						//if false: www.example.com/np/mypage.js == www.eample.com/np/mypage

var node_pages_directory = './np';		//This is the path that the scanner will scan for all of the modules to include. 

var ignore_files = [ ];				//Ignore any files with any of these names.

var server_port = 9000; 			//The port we are running on.

var log_file_path = "nodePages.log";		//location of the logfile that node will log to

var log_to_stdin = true;			//True if you want the output to also be loged to STDIN (terminal)

var log_to_file = true;				//True if you want the output to also be loged to the log file.
						
var error_log_file_path = "nodeErrors.log";		//location of the error logfile that node will log to

var error_log_to_stdin = true;			//True if you want any errors to also be loged to STDIN (terminal)

var error_log_to_file = true;				//True if you want any errors to also be loged to the log file.


//Server
function connectionManager(req, res) {
        var data = "";
        var url = req.url.replace(/(.*\/)*\/np\//, ""); //We want only the file from the path so we remove anything before "/np/"
        req.on('data', function(chunk) { //Get Post data
                chunk = unescape(chunk.toString());
                chunk = chunk.replace(/\+/g, ' ');
                data += chunk;
        });
        req.on('end', function(){ 
                if(data === "" && req.url.indexOf("?") > -1){ //If there was no post data check for Get data
                        var d = req.url.slice(req.url.indexOf("?") + 1, req.url.length);
                        if(d != undefined){
                                data = decodeURI(d);
                                url = url.substring(0, url.indexOf("?")); //removes get data from url.
                        }
                }
		LOGACCESS(url, data, req.headers["user-agent"], req.connection.remoteAddress); 
                if(router[url] != undefined){ //checks to see if the router has a given function. Then executes it.
                        try{
                                router[url].run(data, 
					function(resp, httpcode){ //When called it send resp back to the client.
						if(httpcode == undefined){ httpcode = 200 }
						res.writeHead(httpcode, { 
							'Content-Type': 'text/plain' //Set the content type.
						});
                                		res.end(resp); 
					});
                        }
                        catch(err){ //In the even that something goes haywire, this catch will cause the server to continue running.
				LOGERROR(err + "\n" + err.stack);
                        }
                }
                else{
			res.end("404, The specified page does not exist");//If the request doesnt exist.
                }
        });
}
//Sets up a clean exit no matter if we call LOGACCESS or LOGERROR or not.
process.on('SIGINT', function(){ 
	process.exit();
});

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
		
	return function(error){
		var s = '[' + new Date().toUTCString() + ']		' + error + "\n";
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
	if(path[path.length-1] == "/"){ path.substring(0,path.length-2)};
	while(walkStack.length != 0){
		var dir = walkStack.pop();
		if(dir.indexOf("/.") != -1){
			while(dir.indexOf("/.") != -1){
				dir = walkStack.pop();
				console.log("pop");
			}
		}
		var dirs = fs.readdirSync(dir);
		//console.log(dirs);
		for(var file in dirs){
			file = dirs[file];
			if(!(file in ignore_files)){
				var pathfile = dir +'/' + file
				var stat = fs.statSync(pathfile);
				if(stat.isDirectory()){
					walkStack.push(pathfile);
				}
				else{
					for(var ext in included_Module_Extentions){
						ext = included_Module_Extentions[ext];
						if(file.indexOf(ext) == file.length - ext.length){
							if( include_Module_Extentions_In_URL){
								results.push(pathfile);
							}
							else{
								results.push(pathfile.slice(0,- ext.length));
							}
						}
					}
				}
			}
		}
	}
	return results;
};

function createRouter(path){
	
	var files = walkDirTree(path);
	console.log("Loaded " + files.length + " Modules." );
	
	console.log("Routing with the following routes: ")
	for(var f in files){
		f = files[f];
		route = f.slice(path.length + 1);
		router[route] = require(f);
		console.log("	" + route + "	accessed at " + f);
	}
};

createRouter(node_pages_directory);
http.createServer(connectionManager).listen(server_port);
console.log("Now listening at localhost:" + server_port);
