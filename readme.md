#Node Pages Server
This small file will set up a quick server that will server pages in the ./np/ directory. 

##Usage: 
Copy Server.js into a directory of your site. then run

	node Server.js

It will probably complain about not finding a folder called "np"

	mkdir np

will create the folder where you should put all your node pages. 

##Node page structure.
Every node page should export a function called run. This function will be called when your page is requested. This line MUST be included into your page or the server will not be able to call your page:
	
	exports.run = function(data, res)


Params:

	data [string]:
		this is the raw string of data that was passed into your function.

	res [function (string)]:
		This is the responce function. 
		When your page is done processing data, call this function and pass in a string. This string will be sent back to the client.


##Configs:
Configuring node pages is done inside the Server.js file.

####included_Module_Extentions:
When the server scans for files to include as node pages it looks for specific file extentions inside node_pages_directory.
By defauly this is set to only look for '.js' files.

####include_Module_Extentions_In_URL: 
When the server is accessed the file type may be excluded in the url. 
eg: You have a Node Page named MyFirstPage.js running on port 80 on localhost.
if include_Module_Extentions_In_URL is set to true you will be able to access that node page with the URL
	
	http://localhost/MyFirstPage.js

if it is set to false you will NOT be able to access it at the above url and instead will have to access it at 

	http://localhost/MyFirstPage

This is useful if you do not want to confuse the browser with '.js' extentions.

####node_pages_directory
What ever this is set to will be the directory that nodepages scans to load all of the modules in. 
By default this is set to './np'.

If Server.js is in this directory be sure to add Server.js to ignore_files.

####ignore_files
this should be a comma seperated list of files for node pages to ignore. 
note: If there is a directory in this list of files that directory will NOT be parsed neither will any of the subdirectories in that directory.

####server_port
simply the port you wish for the server to run on. default is 9000 because Thats where I like to run my node servers.

####log_file_path
The path that the access log will be writen to. Access log is a tab seperated log of the time, requested page, user-agent string, and user IP.

####log_to_stdin
If true, the system will log any access requests to the console.

####log_to_file
if true, the system will log any access requests to a file.

####error_log_file_path
The path that the error log will be writen to. Error log consists of the Error message + new line + Stack trace.

####error_log_to_stdin
If true, the system will log any errors to the console.

####error_log_to_file
if true, the system will log any errors to a file.


##Sample node pages:

helloworld.js
	
	exports.run = function(data, res){
		res("Hello World");
	}

echoServer.js
	
	exports.run = function(data, res){
		res(data);
	};

