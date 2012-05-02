![Nodelets Logo](https://github.com/ntkachov/Nodelets/raw/master/icon.png)
#Nodelets Server
Nodelets is a dead simple development server for node.js. Modules used with this server are called nodelets.
The server will automatically load nodelets and track changes, automatically reloading and adding new nodelets as they are created or edited. The server does not have to be restarted and no hook code needs to be added. 
This is meant to be a development server as it has not been tested in production. Although it should be able to handle a small website or prototype.

##Usage: 
Nodelets needs very little to be up and running. After installing node.js run the following commands to install Nodelets.

	curl https://raw.github.com/ntkachov/Node-Pages-Server/master/Server.js > Server.js
	mkdir np

To start the server just run:

	node Server.js


##nodelet structure.
Every nodelet should export a function called run. This function will be called when your page is requested. This line MUST be included into your page or the server will not be able to call your page:
	
	exports.run = function(data, res)


Params:

	data [Object]:
		data.get: This is the raw get request that was included with the URL.
		data.post: This is the raw post data that was included with the request. 

	res [function (string)]:
		This is the response function. 
		When your page is done processing data, call this function and pass in a string. This string will be sent back to the client.

##Accessing a nodelet:
Nodelets are accessed the same way you access a webpage.

	localhost:9000/np/helloworld

URL data can be included with a get request by appending a '?' and any data after. eg:

	localhost:9000/np/helloworld?foo=bar

Note: if 'include_Module_Extentions' is set to 'true' in the config file then the extention must be appended to the url such as 'localhost:9000/np/helloworld.js'. If your file does not contain an extention then Nodelets will allow it to be accessed extentionless.

##Config File:
On first run, Server.js will create a nodelets.config file that will contain the configuration data for the server. Server.js also has it own internal defaults which it will default to should anything go wrong. Changing the internal data will NOT be reflected in the nodelets.config file until the config file is removed and recreated by Server.js. Changing the config file after it is created will cause node to reload the config file. This means any changes made to the config file will be reflected in the server instantly without having to reload the server.

Note: Any changes to the config file will not update the server post-humorously. So if you add a new file to the ignore list Nodelets will only ignore that file moving forward. It will not go back and remove that module from the server. 

##Editing Config File:

####include_Module_Extentions:
When the server scans for files to include as nodelets it looks for specific file extensions inside node_pages_directory.
By default this is set to only look for '.js' files.

This should be a comma seperated list with each file type wraped in single quotes.

####include_Module_Extentions_In_URL: 
When the server is accessed the file type may be excluded in the url. 
eg: You have a nodelet named MyFirstPage.js running on port 80 on localhost.
if include_Module_Extentions_In_URL is set to true you will be able to access that nodelet with the URL
	
	http://localhost/MyFirstPage.js

if it is set to false you will NOT be able to access it at the above url and instead will have to access it at 

	http://localhost/MyFirstPage

This is useful if you do not want to confuse the browser with '.js' extensions.

####node_pages_directory:
What ever this is set to will be the directory that nodepages scans to load all of the modules in. 
By default this is set to './np'.

If Server.js is in this directory be sure to add Server.js to ignore_files.

####ignore_files:
This should be a comma separated list of files for nodelets to ignore. Each file should be wraped in single quotes. 
Note: If there is a directory in this list of files that directory will NOT be parsed neither will any of the subdirectories in that directory.

####server_port:
Simply the port you wish for the server to run on. Default is 9000 because thats where I like to run my node servers.

####log_file_path:
The path that the access log will be written to. Access log is a tab separated log of the time, requested page, user-agent string, and user IP.

####log_to_stdin:
If true, the system will log any access requests to the console.

Note: log_to_stdin and log_to_file are not mutually exclusive. You can log to both, just one, or neither.

####log_to_file:
If true, the system will log any access requests to a file.

Note: log_to_stdin and log_to_file are not mutually exclusive. You can log to both, just one, or neither.

####error_log_file_path:
The path that the error log will be written to. Error log consists of the Error message + new line + Stack trace.

####error_log_to_stdin:
If true, the system will log any errors to the console.

Note: error_log_to_stdin and error_log_to_file are not mutually exclusive. You can log to both, just one, or neither.

####error_log_to_file:
if true, the system will log any errors to a file.

Note: error_log_to_stdin and error_log_to_file are not mutually exclusive. You can log to both, just one, or neither.


##Sample nodelets:

helloworld.js
	
	exports.run = function(data, res){
		res("Hello World");
	}

echoServer.js
	
	exports.run = function(data, res){
		res(data);
	};

slightlyLessTrivial.js

	exports.run = function(data, res){
		var dataAsJson;
		try{
			dataAsJson = JSON.parse(data);
			if(dataAsJson[0] === "nick"){
				res("Good day, nick");
			}
			else{
				res("Hello, " + dataAsJson[0]);
			}
		}
		catch(err){
			res("Malformed url");
		}	
	};

Note:  Because nodelets handles Post and get requests the same this example can be accessed with
'http://localhost:9000/np/testpage?[%22nick%22]'
but is really designed to be used with post requests. For get request you should use a url parser or at least data.split("&"). 
